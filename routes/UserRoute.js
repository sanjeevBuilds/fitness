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

    // Create a new user and explicitly assign all fields
    const newUser = new UserModel();

    // Basic fields from input
    newUser.email = userData.email;
    newUser.password = userData.password;
    newUser.profileName = userData.profileName;

    // Optional fields with safe defaults
    newUser.fullName = userData.fullName || '';
    newUser.age = userData.age ?? null;
    newUser.gender = userData.gender || '';
    newUser.height = userData.height ?? null;
    newUser.weight = userData.weight ?? null;
    newUser.primaryGoal = userData.primaryGoal || '';
    newUser.activityLevel = userData.activityLevel || '';
    newUser.averageSleep = userData.averageSleep ?? null;
    newUser.waterIntake = userData.waterIntake ?? null;
    newUser.mealFrequency = userData.mealFrequency || '';
    newUser.dietType = userData.dietType || '';
    newUser.allergies = Array.isArray(userData.allergies) ? userData.allergies : [];
    newUser.dietaryNotes = userData.dietaryNotes || '';
    if (userData.username && userData.username.trim() !== '') {
        newUser.username = userData.username.trim();
    }
    // Do not set username at all if not provided
    newUser.notificationPreference = userData.notificationPreference || '';
    newUser.bmi = userData.bmi ?? null;
    newUser.targetWeight = userData.targetWeight ?? null;

    // Optional fields with default logic
    newUser.avatar = userData.avatar || 'avator1.jpeg';
    newUser.theme = userData.theme || 'light';
    newUser.exp = userData.exp ?? 0;
    newUser.startDate = new Date();
    newUser.lastLogin = new Date();

    // Subdocuments as empty arrays or default structures
    newUser.notifications = [];
    newUser.friendRequests = [];
    newUser.dailyQuests = [];
    newUser.miniChallenges = [];
    newUser.foodLogs = [];
    newUser.mealPlan = undefined;
    newUser.postureScans = [];
    newUser.insights = [];
    newUser.badges = [];

    // Save to DB (hashing, BMI auto-calc handled in schema pre-save middleware)
    await newUser.save();

    // Prepare response in the same structure as login
    const level = calculateLevel(newUser.exp);
    const token = jwt.sign(
      {
        _id: newUser._id,
        email: newUser.email,
      },
      'your_jwt_secret', // Use env variable in production
      { expiresIn: '2d' }
    );

    res.status(201).json({
      _id: newUser._id,
      profileName: newUser.profileName,
      avatar: newUser.avatar,
      email: newUser.email,
      xp: newUser.exp,
      level: level,
      createdAt: newUser.createdAt,
      token: token
    });
  } catch (err) {
    console.error('User creation failed:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user
router.put('/updateUser/:email', async (req, res) => {
  try {
    const currentEmail = req.params.email.toLowerCase();
    const updateData = { ...req.body };

    // Prevent removal of required fields
    if (
      (updateData.hasOwnProperty('email') && !updateData.email) ||
      (updateData.hasOwnProperty('password') && !updateData.password) ||
      (updateData.hasOwnProperty('profileName') && !updateData.profileName)
    ) {
      return res.status(400).json({ error: 'Cannot remove required fields: email, password, or profileName.' });
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { email: currentEmail },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
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

// GET search users by username or profileName (word-based, partial, case-insensitive)
router.get('/searchUsers', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    // Split query into words, ignore empty
    const words = query.trim().split(/\s+/).filter(Boolean);
    // Build regex for each word (case-insensitive, partial match)
    const regexes = words.map(word => new RegExp(word, 'i'));
    // Find users where any word matches username or profileName
    const users = await UserModel.find({
      $or: [
        { username: { $in: regexes } },
        { profileName: { $in: regexes } }
      ]
    }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search users' });
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
