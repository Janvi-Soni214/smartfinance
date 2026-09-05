const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const crypto = require('crypto');
const Transaction = require('../models/Transaction'); 
const User = require('../models/User');
const ProcessedEmail = require('../models/ProcessedEmail'); // permanent seen-log
const verifyToken = require('../middleware/authMiddleware');
const { z } = require('zod');
const cheerio = require('cheerio');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});
// Helper function: Gmail sends email bodies in Base64 formatting. This decodes it into readable text.
function decodeEmailBody(payload) {
  let base64 = '';
  
  // Gmail payloads can be deeply nested depending on if it's plain text or HTML
  if (payload.parts && payload.parts.length > 0) {
    // Try to find the plain text part first
    const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
    if (textPart && textPart.body && textPart.body.data) {
      base64 = textPart.body.data;
    } else if (payload.parts[0].body && payload.parts[0].body.data) {
      base64 = payload.parts[0].body.data;
    }
  } else if (payload.body && payload.body.data) {
    base64 = payload.body.data;
  }

  if (!base64) return '';
  
  // Replace characters to make it standard Base64, then decode
  const standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(standardBase64, 'base64').toString('utf-8');
}

// Define the absolute truth of what a transaction must look like
const TransactionSchema = z.object({
  amount: z.number().positive(),
  merchant: z.string().min(2),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Enforce ISO-8601
  type: z.enum(["Debit", "Credit"]),
  category: z.string()
});

async function parseEmailWithLLM(htmlBody) {
  // Strip styling and heavy HTML tables down to raw, readable text
  const text = cheerio.load(htmlBody).text().replace(/\s+/g, ' ').trim();
  
  const prompt = `You are a highly precise financial data extraction API for Indian bank transaction alerts.
Analyze the following bank transaction email/SMS text and extract structured data.

CRITICAL RULES FOR "merchant" FIELD:
- For DEBIT transactions: The merchant is the PAYEE — the entity that RECEIVED the money.
  Look for: UPI VPA (e.g. "merchant@okaxis"), beneficiary name, "paid to", "transferred to", "Info:", store name, or any name after "to" keyword.
  Example: "INR 130.00 debited from a/c XX0605 to YOGINI BHAVSAR" → merchant = "YOGINI BHAVSAR"
  Example: "Rs 228 debited. UPI: BigBasket@icici" → merchant = "BigBasket"
  Example: "paid to Swiggy" → merchant = "Swiggy"
- For CREDIT transactions: The merchant is the SENDER — the entity that SENT the money.
  Look for: sender name, "received from", "credited by", UPI sender VPA, or any name before "sent" keyword.
- NEVER use "your account ending XXXX" or any account number as the merchant name.
- If the actual payee/sender name cannot be determined from the text, use a descriptive label like "UPI Transfer" or "Bank Transfer" — not the account number.

CRITICAL RULES FOR "date" FIELD:
- Extract the transaction date, not today's date.
- Format strictly as YYYY-MM-DD.
- Look for patterns like "25-Aug-2026", "25/08/2026", "Aug 25, 2026", etc.

Categorize the merchant into one of these exact strings: ['Food & Dining', 'Transport', 'Bills & Utilities', 'Entertainment', 'Shopping', 'Groceries', 'Uncategorized'].

Respond ONLY with a valid JSON object. No explanation, no markdown, just JSON:
{
  "amount": number,
  "merchant": string,
  "date": "YYYY-MM-DD",
  "type": "Debit" | "Credit",
  "category": string
}

Bank Alert Text:
${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const parsedData = JSON.parse(response.text);
  return TransactionSchema.parse(parsedData);
}

// @route   POST /api/gmail/sync
// @desc    Scan Gmail for bank transactions and import them
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { googleAccessToken } = req.body;
    
    // 1. Fetch the authenticated user profile from the database
    const user = await User.findById(req.user.id);
    
    // 2. Establish the synchronization high-water mark
    let syncDate = user.lastEmailSync;
    
    // If the account lacks a sync timestamp (legacy user or incomplete onboarding),
    // we generate a dynamic fallback timestamp targeting exactly 24 hours ago.
    if (!syncDate) {
      console.log("No previous sync timestamp found. Generating 24-hour historical fallback window.");
      syncDate = new Date();
      syncDate.setHours(syncDate.getHours() - 24); 
      // 🔥 TEMPORARY HACK: Force the engine to look back 14 days to catch deleted test emails
      syncDate = new Date();
      syncDate.setDate(syncDate.getDate() - 14);
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: googleAccessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 3. DELTA SYNC: Convert the final validated date into a UNIX Epoch timestamp
    const syncUnixTime = Math.floor(new Date(syncDate).getTime() / 1000);
    
    // Only fetch emails received AFTER the exact second of the last sync
    const searchQuery = `in:inbox -in:sent after:${syncUnixTime} (subject:"debited" OR subject:"spent" OR subject:"paid" OR subject:"transaction" OR subject:"alert" OR subject:"receipt" OR subject:"credit" OR subject:"credited" OR subject:"txn" OR subject:"update" OR subject:"payment" OR subject:"transfer" OR subject:"a/c")`;

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 50 // Can safely increase this since we are only fetching NEW emails
    });

    const messages = response.data.messages || [];
    if (messages.length === 0) {
      return res.status(200).json({ message: "Inbox up to date! 0 new transactions." });
    }

    let importedCount = 0;
    
   for (const msg of messages) {
      const emailDetails = await gmail.users.messages.get({ 
        userId: 'me', 
        id: msg.id,
        format: 'full' 
      });
      
      const headers = emailDetails.data.payload.headers;
      const subjectHeader = headers.find(h => h.name === 'Subject');
      const subject = subjectHeader ? subjectHeader.value : '';
      const body = decodeEmailBody(emailDetails.data.payload);

      let parsedData;
      try {
        // Pass the text through the new universal LLM parser
        parsedData = await parseEmailWithLLM(`Subject: ${subject}\n\n${body}`);
      } catch (error) {
        console.error(`⏭️ Skipping email ${msg.id}: LLM extraction or validation failed.`, error.message);
        continue;
      }

      // Convert Debit to negative amount to preserve legacy model compatibility
      const finalAmount = parsedData.type === 'Debit' ? -Math.abs(parsedData.amount) : Math.abs(parsedData.amount);

      // B. CREATE THE FINANCIAL FINGERPRINT
      // Deduplication based on amount + date + merchant
      const fallbackString = `${req.user.id}_${finalAmount}_${parsedData.date}_${parsedData.merchant}`;
      const uniqueFinancialKey = crypto.createHash('sha256').update(fallbackString).digest('hex');

      // C. PERMANENT DEDUPLICATION — check the seen-log, not the Transaction collection.
      // This means deleting a transaction from the dashboard will NOT cause a re-import.
      const alreadySeen = await ProcessedEmail.findOne({
        user: req.user.id,
        gmailMessageId: msg.id,
      });

      if (alreadySeen) {
        console.log(`⏭️ Already processed email ${msg.id}, skipping.`);
        continue;
      }

      // D. SAVE THE CLEAN RECORD
      const newTx = new Transaction({
        user: req.user.id,
        name: parsedData.merchant,
        category: parsedData.category,
        amount: finalAmount,
        date: parsedData.date,
        source: 'GMAIL',
        status: 'Completed',
        gmailMessageId: msg.id,
        financialRefHash: uniqueFinancialKey
      });

        try {
          await newTx.save();
          importedCount++;

          const io = req.app.get('io');
          if (io) io.to(req.user.id).emit('transaction_added', newTx);
        } catch (dbErr) {
          if (dbErr.code !== 11000) {
            console.error("DB Save Failure:", dbErr);
          }
        }

        // D2. ALWAYS mark this message as permanently seen, regardless of whether
        //     the transaction save succeeded (prevents any future re-import).
        try {
          await ProcessedEmail.create({
            user: req.user.id,
            gmailMessageId: msg.id,
            financialRefHash: uniqueFinancialKey,
          });
        } catch (seenErr) {
          // Ignore duplicate key errors (race condition); any other error log it
          if (seenErr.code !== 11000) console.error('ProcessedEmail write error:', seenErr);
        }
    }

    // 4. Update the sync clock! (Problems 1, 3, & 4)
    // Now that we caught up, set the clock to right now so the next run only gets future emails.
    user.lastEmailSync = new Date();
    await user.save();

    res.status(200).json({ message: `Successfully imported ${importedCount} transactions from Gmail!` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during Gmail sync.' });
  }
});

module.exports = router;