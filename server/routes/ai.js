const express = require('express');
const router = express.Router();
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const verifyToken = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id || req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    // 1. Fetch ALL transactions strictly for the authenticated user
    const userTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Pre-calculate summary statistics for high precision
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpending = {};

    userTransactions.forEach((tx) => {
      const amount = Number(tx.amount);
      if (amount > 0) {
        totalIncome += amount;
      } else {
        const absExpense = Math.abs(amount);
        totalExpenses += absExpense;
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + absExpense;
      }
    });

    const currentBalance = totalIncome - totalExpenses;

    // 3. Structure the clean transaction list for the AI
    const compactTransactions = userTransactions.map((tx) => ({
      date: tx.date,
      name: tx.name,
      category: tx.category,
      amount: tx.amount,
      type: tx.amount > 0 ? 'Credit (Income)' : 'Debit (Expense)',
      status: tx.status
    }));

    // 4. Construct complete account context object
    const accountContext = {
      accountMetrics: {
        totalBalance: `₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        totalIncome: `₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        totalExpenses: `₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        totalTransactionsCount: userTransactions.length,
        spendingByCategory: categorySpending
      },
      transactions: compactTransactions
    };

    // 5. System instructions ensuring privacy and deep context awareness
    const systemInstruction = `
You are the dedicated AI Finance Assistant built inside the SpendSmart personal finance application.
You have FULL, direct access to the live account records of the currently logged-in user provided below in JSON format.

Core Behavioral Rules:
1. STRICT USER ISOLATION: The provided financial data belongs exclusively to this authenticated account. Treat this data as the absolute ground truth.
2. TRANSACTION LOOKUPS: When the user asks about specific people, merchants (e.g., "Janvi", "SONI JANVIBEN DIPESHBHAI", "Starbucks"), categories, or dates, search the "transactions" array thoroughly. Calculate totals, list specific transactions with dates, amounts, and statuses accurately.
3. DOMAIN RESTRICTION: You ONLY assist with personal finance topics: expenses, income, budgets, savings, balance history, transactions, cash flow analysis, and basic financial/investment literacy.
4. UNRELATED QUERIES: If the user asks non-finance questions (e.g., general programming, recipes, general trivia, weather), politely decline and state that you only assist with their personal finances.
5. FINANCIAL SAFETY: For investment or stock questions, provide educational explanations only. Never guarantee returns or provide direct buy/sell mandates.
6. FORMATTING: Format all currency amounts with the ₹ symbol and comma separators. Use clean Markdown (bullet points, bold highlights) for readability. NEVER use Markdown tables. Tables will break the UI, so always use bulleted lists instead.

Live User Account Database Records:
${JSON.stringify(accountContext, null, 2)}
`;

    // 6. Generate response from Gemini
    const response = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: message,
      system_instruction: systemInstruction
    });

    res.json({ reply: response.output_text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Check if it's a rate limit / quota error
    if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('quota'))) {
      return res.status(429).json({ message: "AI Engine is out of capacity (Quota Exceeded). Please wait a bit." });
    }

    res.status(500).json({ message: "Failed to process query with the AI engine." });
  }
});

module.exports = router;