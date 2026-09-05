const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const verifyToken = require('../middleware/authMiddleware');

// GET: Fetch all budgets for the logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const budgets = await Budget.find({ user: userId });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching budgets" });
  }
});

// POST: Create or Update a budget limit
router.post('/', verifyToken, async (req, res) => {
  try {
    const { category, limit } = req.body;
    const userId = req.user.id || req.user._id;

    // findOneAndUpdate with upsert: true will create it if it doesn't exist, or update if it does
    const budget = await Budget.findOneAndUpdate(
      { user: userId, category: category },
      { limit: limit },
      { new: true, upsert: true } 
    );

    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: "Error saving budget" });
  }
});

// DELETE: Remove a budget
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Budget.findOneAndDelete({ _id: req.params.id, user: userId });
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: "Error deleting budget" });
  }
});

module.exports = router;