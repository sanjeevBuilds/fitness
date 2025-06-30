const express = require('express');
const router = express.Router();
const UserModel = require('../models/User');

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
    const { email, password, profileName, avatar, exp } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const newUser = new UserModel({
      email: email.toLowerCase(),
      password,
      profileName,
      avatar: 'avator1.jpeg',
      exp: exp || 0
    });

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
    
    // Check password (simple comparison for now)
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Calculate level based on XP
    const level = calculateLevel(user.exp);
    
    // Return user data
    res.json({
      success: true,
      profileName: user.profileName,
      avatar: user.avatar,
      email: user.email,
      xp: user.exp,
      level: level,
      createdAt: user.createdAt
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
