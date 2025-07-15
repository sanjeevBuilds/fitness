const express = require('express');
const router = express.Router();
const UserModel = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// GET all users (excluding passwords)
router.get('/getUser', async (req, res) => {
  try {
    const users = await UserModel.find().select('-password'); // Exclude password from response
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET user by email (excluding password)
router.get('/getUser/:email', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST create new user
router.post('/createUser', async (req, res) => {
  try {
    const userData = req.body;
    userData.email = userData.email.toLowerCase();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user with all fields from request body
    const newUser = new UserModel(userData);
    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user
router.put('/updateUser/:email', async (req, res) => {
  try {
    const { email, password, profileName, avatar } = req.body;
    const currentEmail = req.params.email.toLowerCase();
    
    // Build update object
    const updateData = {};
    if (profileName) updateData.profileName = profileName;
    if (avatar) updateData.avatar = avatar;
    if (password) updateData.password = password;
    
    // If email is being changed, check if new email already exists
    if (email && email.toLowerCase() !== currentEmail) {
      const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      updateData.email = email.toLowerCase();
    }
    
    const updatedUser = await UserModel.findOneAndUpdate(
      { email: currentEmail },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate level for response
    const level = calculateLevel(updatedUser.exp);

    res.json({
      ...updatedUser.toObject(),
      level: level
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/deleteUser/:email', async (req, res) => {
  try {
    const deletedUser = await UserModel.findOneAndDelete({ 
      email: req.params.email.toLowerCase() 
    });

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PATCH add experience points
router.patch('/addExp/:email', async (req, res) => {
  try {
    const { expToAdd } = req.body;
    
    if (!expToAdd || expToAdd <= 0) {
      return res.status(400).json({ error: 'Experience points must be a positive number' });
    }

    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.exp += expToAdd;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add experience points' });
  }
});

// POST login route
// POST login route
router.post('/login', async (req, res) => {
  console.log('POST /api/login hit');
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });
  
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password (use bcrypt for comparison)
    const isMatch = await bcrypt.compare(password, user.password);
   
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Calculate level based on XP
    const level = calculateLevel(user.exp);

    // JWT token generation (expires in 2 days)
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
      },
      'your_jwt_secret', // TODO: Use env variable in production
      { expiresIn: '2d' }
    );

    // ✅ Return user data including _id and token
    res.json({
      success: true,
      _id: user._id,
      profileName: user.profileName,
      avatar: user.avatar,
      email: user.email,
      xp: user.exp,
      level: level,
      createdAt: user.createdAt,
      token: token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});


// Helper function to calculate level based on XP
function calculateLevel(xp) {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  return Math.floor((xp - 4500) / 1000) + 10;
}

module.exports = router;
