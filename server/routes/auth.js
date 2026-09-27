const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const axios = require('axios');
const auth = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to database
    user = new User({ name: fullName, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create and assign JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, categories: user.categories, profileImage: user.profileImage }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/google
// @desc    Authenticate user via Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { access_token } = req.body;

    // 1. Securely fetch user details from Google's servers
    const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const { email, name } = googleResponse.data;

    // 2. Check if this user already exists in our MongoDB
    let user = await User.findOne({ email });
    
    // 3. If they don't exist, register them automatically
    if (!user) {
      // Generate a random password for their local account
      const randomPassword = Math.random().toString(36).slice(-12);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      user = new User({ name: name, email, password: hashedPassword });
      await user.save();
    }

    // 4. Generate our custom JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, categories: user.categories, profileImage: user.profileImage, isGoogleUser: true }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Google authentication failed', error: err.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile details (Name & Phone)
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage } = req.body;
    
    // Combine first and last name back together
    const fullName = `${firstName} ${lastName}`.trim();

    // Find the user by the ID extracted from the token
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    user.name = fullName || user.name;
    user.phone = phone !== undefined ? phone : user.phone;
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    // Send the updated user back to React
    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, categories: user.categories, profileImage: user.profileImage }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   PUT /api/auth/categories
// @desc    Update user's expense categories
router.put('/categories', auth, async (req, res) => {
  try {
    const { categories } = req.body;
    
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.categories = categories || user.categories;
    await user.save();

    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, categories: user.categories, profileImage: user.profileImage }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating categories' });
  }
});

// @route   PUT /api/auth/settings
// @desc    Update user settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.settings = { ...user.settings, ...settings };
    await user.save();

    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, categories: user.categories, profileImage: user.profileImage, settings: user.settings }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account and all associated data
router.delete('/account', auth, async (req, res) => {
  try {
    const { currentPassword } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate password before deletion
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

    // Delete user's transactions, budgets, and processed emails
    const Transaction = require('../models/Transaction');
    const Budget = require('../models/Budget');
    const ProcessedEmail = require('../models/ProcessedEmail');
    
    await Transaction.deleteMany({ userId: user._id });
    await Budget.deleteMany({ userId: user._id });
    await ProcessedEmail.deleteMany({ userId: user._id });

    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

module.exports = router;