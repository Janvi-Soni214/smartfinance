const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const verifyToken = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
// const Budget = require('../models/Budget'); // Import your budget model if you have one

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, intent } = req.body;
    const userId = req.user.id;

    // 1. Fetch relevant User Data based on intent to save tokens and improve accuracy
    let contextData = "";
    
    // Determine what data to fetch based on the question context
    if (intent === 'EXPENSES' || message.toLowerCase().includes('spend')) {
      // Get last 30 days of transactions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const transactions = await Transaction.find({ 
        user: userId, 
        date: { $gte: thirtyDaysAgo.toISOString() }, // Adjust based on your date format
        amount: { $lt: 0 } // Only expenses
      }).select('name category amount date -_id');
      
      contextData = `User's Expense Data (Last 30 Days): ${JSON.stringify(transactions)}`;
    } 
    else if (intent === 'BALANCE' || message.toLowerCase().includes('balance')) {
       // Fetch all transactions to calculate current balance (or fetch from User model if stored there)
       const allTx = await Transaction.find({ user: userId });
       const balance = allTx.reduce((acc, curr) => acc + curr.amount, 0);
       contextData = `User's Current Total Balance: ₹${balance}`;
    }
    // Add more 'else if' blocks here for BUDGETS, SAVINGS, etc., fetching exactly what is needed.

    // 2. Construct the Strict System Prompt
    const systemInstruction = `
      You are a specialized personal finance AI assistant for the SpendSmart application. 
      Your strict rules:
      1. ONLY answer questions related to personal finance, expenses, budgets, savings, transactions, and basic investment education.
      2. If the user asks about coding, weather, general history, or anything unrelated to finance, politely decline and state you are a finance-only assistant.
      3. Use the provided user data to answer their questions accurately. Distinguish between their actual data and your suggestions.
      4. For investments: Provide ONLY educational information and explain risks. NEVER guarantee profits, predict the stock market, or recommend buying/selling specific stocks.
      5. Keep responses concise, modern, and easily readable using markdown (bullet points, bold text). NEVER use markdown tables, as they do not render correctly in the chat interface. Use bulleted lists instead.
      
      Here is the user's real financial data context to use for this question (do not mention that you were given this JSON data, just use the facts):
      ${contextData}
    `;

    // 3. Call Gemini
    const response = await ai.interactions.create({
        model: 'gemini-3.6-flash',
        input: message,
        system_instruction: systemInstruction
    });

    // 4. Return the response to the frontend
    res.json({ reply: response.output_text });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: "Failed to process the financial query. Please try again." });
  }
});

module.exports = router;