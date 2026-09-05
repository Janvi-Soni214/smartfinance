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
      user: { id: user._id, name: user.name, email: user.email }
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
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile details (Name & Phone)
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    // Combine first and last name back together
    const fullName = `${firstName} ${lastName}`.trim();

    // Find the user by the ID extracted from the token
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    user.name = fullName || user.name;
    user.phone = phone !== undefined ? phone : user.phone;

    await user.save();

    // Send the updated user back to React
    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});
module.exports = router;