const express = require('express');
const router = express.Router();
const UserModel = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const FoodLogModel = require('../models/FoodLog'); // Added for syncing steps quest

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

    // Reset daily quests on login
    await resetDailyQuests(user);

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

// POST send friend request
router.post('/sendFriendRequest', async (req, res) => {
  try {
    const { toEmail, fromEmail, fromProfileName, fromAvatar } = req.body;
    if (!toEmail || !fromEmail || toEmail === fromEmail) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    // Find recipient
    const recipient = await UserModel.findOne({ email: toEmail.toLowerCase() });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    // Check for existing pending request from this sender
    const alreadyRequested = recipient.friendRequests.some(
      fr => fr.email === fromEmail && fr.status === 'pending'
    );
    if (alreadyRequested) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }
    // Add new friend request
    recipient.friendRequests.push({
      email: fromEmail,
      profileName: fromProfileName,
      avatar: fromAvatar,
      status: 'pending',
      sentAt: new Date()
    });
    await recipient.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// PATCH respond to a friend request (accept/reject)
router.patch('/respondFriendRequest', async (req, res) => {
  try {
    const { fromEmail, toEmail, action } = req.body;
    if (!fromEmail || !toEmail || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    // Find recipient (the one responding)
    const recipient = await UserModel.findOne({ email: toEmail.toLowerCase() });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    // Find the friend request
    const reqIndex = recipient.friendRequests.findIndex(fr => fr.email === fromEmail && fr.status === 'pending');
    if (reqIndex === -1) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    // Accept or reject
    if (action === 'accept') {
      // Add to friends if not already
      const alreadyFriend = recipient.friends && recipient.friends.some(f => f.email === fromEmail);
      if (!alreadyFriend) {
        // Try to get sender's info for profileName/avatar/level
        const sender = await UserModel.findOne({ email: fromEmail.toLowerCase() });
        recipient.friends.push({
          email: fromEmail,
          profileName: sender ? sender.profileName : recipient.friendRequests[reqIndex].profileName,
          avatar: sender ? sender.avatar : recipient.friendRequests[reqIndex].avatar,
          level: sender ? sender.level : 1
        });
      }
    }
    // Remove the friend request
    recipient.friendRequests.splice(reqIndex, 1);
    await recipient.save();
    res.json({ success: true, friendRequests: recipient.friendRequests, friends: recipient.friends });
  } catch (err) {
    console.error('Respond friend request error:', err);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// PATCH reject all friend requests
router.patch('/rejectAllFriendRequests', async (req, res) => {
  try {
    const { toEmail } = req.body;
    if (!toEmail) return res.status(400).json({ error: 'Invalid request' });
    const user = await UserModel.findOne({ email: toEmail.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.friendRequests = user.friendRequests.filter(fr => fr.status !== 'pending');
    await user.save();
    res.json({ success: true, friendRequests: user.friendRequests });
  } catch (err) {
    console.error('Reject all friend requests error:', err);
    res.status(500).json({ error: 'Failed to reject all friend requests' });
  }
});

// PATCH toggle daily quest (except steps)
router.patch('/quests/:questType', async (req, res) => {
  try {
    const { questType } = req.params;
    const { completed, currentProgress } = req.body;
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().slice(0, 10);
    const quest = user.dailyQuests.find(q => q.date === today && q.questType === questType);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    // Steps quest: allow repeatable updates
    if (questType === 'steps') {
      if (typeof currentProgress === 'number') {
        quest.currentProgress = currentProgress;
        // Sync calories/protein from FoodLog
        const foodLogs = await FoodLogModel.find({ userId: user._id, date: today });
        quest.calories = foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
        quest.protein = foodLogs.reduce((sum, log) => sum + (log.protein || 0), 0);
      }
    } else {
      // Other quests: lock after completion
      if (quest.completed) {
        return res.status(400).json({ error: 'Quest already completed and locked for today' });
      }
      if (completed === true) {
        quest.completed = true;
        // Award XP and coins
        const xpGained = calculateQuestXP(questType);
        user.exp += xpGained;
        user.coins = (user.coins || 0) + 5; // Example: 5 coins per quest
        // Level up logic
        const newLevel = calculateLevel(user.exp);
        if (newLevel > user.level) {
          user.level = newLevel;
          user.activityLog = user.activityLog || [];
          user.activityLog.unshift({
            type: 'levelup',
            date: new Date(),
            details: `Leveled up to ${newLevel}`
          });
        }
        // Log activity
        user.activityLog = user.activityLog || [];
        user.activityLog.unshift({
          type: 'quest',
          questType,
          date: new Date(),
          details: `Completed ${quest.questName}`
        });
        // Keep only last 20 activities
        user.activityLog = user.activityLog.slice(0, 20);
      }
    }

    await user.save();
    res.json({ success: true, quest, xp: user.exp, level: user.level, coins: user.coins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quest', details: err.message });
  }
});

// PATCH set active badge
router.patch('/setActiveBadge', async (req, res) => {
  try {
    const { email, badge } = req.body;
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.badges || !user.badges.includes(badge)) {
      return res.status(400).json({ error: 'Badge not unlocked' });
    }
    user.activeBadge = badge;
    await user.save();
    res.json({ success: true, activeBadge: user.activeBadge });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set active badge', details: err.message });
  }
});

// PATCH set active title
router.patch('/setActiveTitle', async (req, res) => {
  try {
    const { email, title } = req.body;
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.titles || !user.titles.includes(title)) {
      return res.status(400).json({ error: 'Title not unlocked' });
    }
    user.activeTitle = title;
    await user.save();
    res.json({ success: true, activeTitle: user.activeTitle });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set active title', details: err.message });
  }
});

// PATCH unlock badge (for demo/testing, or call from quest logic)
router.patch('/unlockBadge', async (req, res) => {
  try {
    const { email, badge } = req.body;
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.badges = user.badges || [];
    if (!user.badges.includes(badge)) user.badges.push(badge);
    await user.save();
    res.json({ success: true, badges: user.badges });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unlock badge', details: err.message });
  }
});

// PATCH unlock title (for demo/testing, or call from quest logic)
router.patch('/unlockTitle', async (req, res) => {
  try {
    const { email, title } = req.body;
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.titles = user.titles || [];
    if (!user.titles.includes(title)) user.titles.push(title);
    await user.save();
    res.json({ success: true, titles: user.titles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unlock title', details: err.message });
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

// Helper function to calculate XP for quests
function calculateQuestXP(questType) {
  switch (questType) {
    case 'water':
      return 10;
    case 'exercise':
      return 15;
    case 'sleep':
      return 20;
    case 'steps':
      return 5; // Steps quest is handled by food log sync
    default:
      return 0;
  }
}

// Helper function to reset daily quests (call on login or at midnight)
async function resetDailyQuests(user) {
  const today = new Date().toISOString().slice(0, 10);
  // Keep only today's steps quest
  user.dailyQuests = user.dailyQuests.filter(q => q.date === today && q.questType === 'steps');
  // Add default quests for today (except steps)
  const defaultQuests = [
    { date: today, questType: 'water', questName: 'Hydration Master', target: 8, currentProgress: 0, completed: false },
    { date: today, questType: 'sleep', questName: 'Sleep Warrior', target: user.averageSleep || 8, currentProgress: 0, completed: false },
    { date: today, questType: 'posture', questName: 'Posture Pro', target: 1, currentProgress: 0, completed: false },
    { date: today, questType: 'meal', questName: 'Nutrition Tracker', target: 1, currentProgress: 0, completed: false },
    { date: today, questType: 'exercise', questName: 'Fitness Fanatic', target: 30, currentProgress: 0, completed: false }
  ];
  for (const quest of defaultQuests) {
    if (!user.dailyQuests.some(q => q.date === today && q.questType === quest.questType)) {
      user.dailyQuests.push(quest);
    }
  }
  await user.save();
}

module.exports = router;
