const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User'); // <-- ADDED: Need this to update the sync timeline
const verifyToken = require('../middleware/authMiddleware'); // <-- RENAMED: Changed 'auth' to 'verifyToken' for consistency

// @route   GET /api/transactions
// @desc    Get ONLY the logged-in user's transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    // Find transactions where the 'user' matches the ID from the secure token
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/transactions
// @desc    Add a new transaction for the logged-in user
router.post('/', verifyToken, async (req, res) => {
  try {
    const newTransaction = new Transaction({
      ...req.body,
      user: req.user.id // <-- Attach the user's ID to the new transaction
    });
    
    const savedTransaction = await newTransaction.save();

    // Baseline Lock Logic...
    if (req.body.isInitialSetup) {
      await User.findByIdAndUpdate(req.user.id, { lastEmailSync: new Date() });
    }

    // 🔥 EMIT TO SOCKET: Instantly push the new manual transaction to the UI
    const io = req.app.get('io');
    io.to(req.user.id).emit('transaction_added', savedTransaction);

    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error("Transaction insertion error:", err);
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction (only if the user owns it)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    // Check if the user trying to delete it actually owns it
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction (e.g. category)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    // Check if the user trying to update it actually owns it
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this' });
    }

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;