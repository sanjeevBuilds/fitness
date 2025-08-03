const express = require('express');
const router = express.Router();
const UserModel = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const FoodLogModel = require('../models/FoodLogModel');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// GET all users (excluding passwords)
router.get('/getUser', async (req, res) => {
  try {
    const users = await UserModel.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET user rankings sorted by XP
router.get('/rankings', async (req, res) => {
  try {
    const users = await UserModel.find()
      .select('email username profileName exp level')
      .sort({ exp: -1, level: -1 }) // Sort by exp descending, then by level descending
      .limit(100); // Limit to top 100 users
    
    res.json(users);
  } catch (err) {
    console.error('Rankings error:', err);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// GET user's rank by email
router.get('/rank/:email', async (req, res) => {
  try {
    const userEmail = req.params.email.toLowerCase();
    
    // Get all users sorted by XP
    const allUsers = await UserModel.find()
      .select('email exp level')
      .sort({ exp: -1, level: -1 });
    
    // Find the user's position (rank)
    const userRank = allUsers.findIndex(user => user.email === userEmail) + 1;
    
    if (userRank === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's data
    const user = allUsers.find(user => user.email === userEmail);
    
    res.json({
      rank: userRank,
      totalUsers: allUsers.length,
      xp: user.exp,
      level: user.level
    });
  } catch (err) {
    console.error('Get user rank error:', err);
    res.status(500).json({ error: 'Failed to get user rank' });
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

// GET search users by query
router.get('/searchUsers', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json([]);
    }

    const searchQuery = query.trim();
    
    // Search in username, profileName, and email fields (prioritize username)
    const users = await UserModel.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { profileName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    }).select('-password').limit(10);

    res.json(users);
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// POST send friend request
router.post('/sendFriendRequest', async (req, res) => {
  try {
    const { toEmail, fromEmail, fromProfileName, fromAvatar } = req.body;
    
    console.log('Received friend request data:', { toEmail, fromEmail, fromProfileName, fromAvatar });
    
    if (!toEmail || !fromEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the sender user to check cooldown
    const sender = await UserModel.findOne({ email: fromEmail.toLowerCase() });
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Check 6-hour cooldown for sent requests
    const cooldownCheckTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentRequest = sender.sentFriendRequests && sender.sentFriendRequests.find(
      req => req.toEmail === toEmail.toLowerCase() && req.sentAt > cooldownCheckTime
    );
    
    if (recentRequest) {
      const timeLeft = Math.ceil((recentRequest.sentAt.getTime() + 6 * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000));
      return res.status(400).json({ 
        error: `You can only send one friend request every 6 hours. Try again in ${timeLeft} hours.` 
      });
    }

    // Find the recipient user
    const recipient = await UserModel.findOne({ email: toEmail.toLowerCase() });
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request already exists
    const existingRequest = recipient.friendRequests.find(
      req => req.email === fromEmail.toLowerCase()
    );
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Check if already friends
    const isAlreadyFriend = recipient.friends && recipient.friends.some(
      friend => friend.email === fromEmail.toLowerCase()
    );
    
    if (isAlreadyFriend) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Add friend request
    const friendRequest = {
      email: fromEmail.toLowerCase(),
      profileName: fromProfileName,
      avatar: fromAvatar,
      sentAt: new Date(),
      status: 'pending'
    };

    console.log('Creating friend request object:', friendRequest);

    if (!recipient.friendRequests) {
      recipient.friendRequests = [];
    }
    
    recipient.friendRequests.push(friendRequest);
    console.log('Recipient friend requests after adding:', recipient.friendRequests);
    await recipient.save();

    // Add to sender's sent requests record
    const sentRequest = {
      toEmail: toEmail.toLowerCase(),
      sentAt: new Date()
    };

    if (!sender.sentFriendRequests) {
      sender.sentFriendRequests = [];
    }
    
    // Clean up old sent requests (older than 6 hours)
    const cleanupTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      req => req.sentAt > cleanupTime
    );
    
    sender.sentFriendRequests.push(sentRequest);
    await sender.save();

    res.json({ success: true, message: 'Friend request sent successfully' });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// POST respond to friend request (accept/reject)
router.post('/respondFriendRequest', async (req, res) => {
  try {
    const { fromEmail, toEmail, action } = req.body;
    
    console.log('Responding to friend request:', { fromEmail, toEmail, action });
    
    if (!fromEmail || !toEmail || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Find the recipient user
    const recipient = await UserModel.findOne({ email: toEmail.toLowerCase() });
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the sender user
    const sender = await UserModel.findOne({ email: fromEmail.toLowerCase() });
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Find and remove the friend request
    const requestIndex = recipient.friendRequests.findIndex(
      req => req.email === fromEmail.toLowerCase()
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const friendRequest = recipient.friendRequests[requestIndex];
    recipient.friendRequests.splice(requestIndex, 1);

    if (action === 'accept') {
      console.log('Accepting friend request...');
      
      // Add to friends list for both users
      const recipientFriend = {
        email: sender.email,
        profileName: sender.username || sender.profileName,
        avatar: sender.avatar,
        level: sender.level,
        exp: sender.exp,
        addedAt: new Date()
      };

      const senderFriend = {
        email: recipient.email,
        profileName: recipient.username || recipient.profileName,
        avatar: recipient.avatar,
        level: recipient.level,
        exp: recipient.exp,
        addedAt: new Date()
      };

      console.log('Recipient friend object:', recipientFriend);
      console.log('Sender friend object:', senderFriend);

      if (!recipient.friends) recipient.friends = [];
      if (!sender.friends) sender.friends = [];

      recipient.friends.push(recipientFriend);
      sender.friends.push(senderFriend);
      
      console.log('Recipient friends after adding:', recipient.friends);
      console.log('Sender friends after adding:', sender.friends);
    } else if (action === 'reject') {
      // Remove the sent request from sender's cooldown list to allow resending
      if (sender.sentFriendRequests) {
        sender.sentFriendRequests = sender.sentFriendRequests.filter(
          req => req.toEmail !== recipient.email.toLowerCase()
        );
      }
    }

    console.log('Saving recipient and sender...');
    await recipient.save();
    await sender.save();
    console.log('Both users saved successfully');

    res.json({ 
      success: true, 
      message: action === 'accept' ? 'Friend request accepted' : 'Friend request rejected' 
    });
  } catch (err) {
    console.error('Respond to friend request error:', err);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// POST reject all friend requests
router.post('/rejectAllFriendRequests', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear all friend requests
    user.friendRequests = [];
    await user.save();

    res.json({ success: true, message: 'All friend requests rejected' });
  } catch (err) {
    console.error('Reject all friend requests error:', err);
    res.status(500).json({ error: 'Failed to reject all friend requests' });
  }
});

// POST create new user
router.post('/createUser', async (req, res) => {
  try {
    const userData = req.body;
    userData.email = userData.email.toLowerCase();

    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser = new UserModel();
    newUser.email = userData.email;
    newUser.password = userData.password;
    newUser.profileName = userData.profileName;
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
    
    newUser.notificationPreference = userData.notificationPreference || '';
    newUser.bmi = userData.bmi ?? null;
    newUser.targetWeight = userData.targetWeight ?? null;
    newUser.avatar = userData.avatar || 'avator1.jpeg';
    newUser.theme = userData.theme || 'light';
    newUser.exp = userData.exp ?? 0;
    newUser.coins = 0; // Initialize coins
    newUser.level = 1; // Initialize level
    newUser.startDate = new Date();
    newUser.lastLogin = new Date();

    // Initialize gamification arrays
    newUser.notifications = [];
    newUser.friendRequests = [];
    // dailyQuests removed - using questStats for tracking instead
    newUser.miniChallenges = [];
    newUser.foodLogs = [];
    newUser.mealPlan = undefined;
    newUser.postureScans = [];

    // Badges removed - only titles are used now
    newUser.titles = [];
    newUser.activityLog = [];

    await newUser.save();

    const level = calculateLevel(newUser.exp);
    const token = jwt.sign(
      { _id: newUser._id, email: newUser.email },
      'your_jwt_secret',
      { expiresIn: '2d' }
    );

    res.status(201).json({
      _id: newUser._id,
      profileName: newUser.profileName,
      avatar: newUser.avatar,
      email: newUser.email,
      xp: newUser.exp,
      level: level,
      coins: newUser.coins,
      createdAt: newUser.createdAt,
      token: token
    });
  } catch (err) {
    console.error('User creation failed:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset daily quests on login
    // resetDailyQuests removed - dailyQuests no longer used
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const level = calculateLevel(user.exp);
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      'your_jwt_secret',
      { expiresIn: '2d' }
    );

    res.json({
      success: true,
      _id: user._id,
      profileName: user.profileName,
      avatar: user.avatar,
      email: user.email,
      xp: user.exp,
      level: level,
      coins: user.coins || 0,
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

// PATCH update daily quest progress - Simplified version
router.patch('/updateDailyQuest', authenticateToken, async (req, res) => {
  try {
    const { questType, progress, completed } = req.body;
    console.log(`[updateDailyQuest] Request received: questType=${questType}, progress=${progress}, completed=${completed}`);
    
    const user = await UserModel.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize questStats if it doesn't exist
    if (!user.questStats) {
      user.questStats = {
        totalQuestsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastQuestDate: null,
        stepGoalHistory: [],
        proteinStreak: 0,
        proteinLongestStreak: 0,
        proteinLastCompletedDate: null,
        calorieStreak: 0,
        calorieLongestStreak: 0,
        calorieLastCompletedDate: null
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    let unlockedTitles = [];

    // Check if quest should be completed
    const isRegularQuest = ['water', 'sleep', 'exercise', 'meal'].includes(questType);
    const shouldComplete = isRegularQuest ? 
      (progress >= 1) : 
      (progress >= getQuestTarget(questType, user));
    
    if (shouldComplete && completed !== false) {
      console.log(`[updateDailyQuest] Marking quest as completed: ${questType}, progress: ${progress}`);
      
      // Check if already completed today to prevent duplicate awards
      const alreadyCompleted = user.dailyQuestCompletions?.[today]?.[questType];
      if (alreadyCompleted) {
        console.log(`[updateDailyQuest] Quest ${questType} already completed today, skipping award`);
        return res.json({
          success: true,
          questType: questType,
          progress: progress,
          completed: true,
          xp: user.exp,
          level: user.level,
          coins: user.coins,
          leveledUp: false,
          unlockedTitles: [],
          questStats: user.questStats
        });
      }
      
      // Track daily quest completion
      if (isRegularQuest) {
        if (!user.dailyQuestCompletions) user.dailyQuestCompletions = {};
        if (!user.dailyQuestCompletions[today]) user.dailyQuestCompletions[today] = {};
        user.dailyQuestCompletions[today][questType] = true;
        user.markModified('dailyQuestCompletions');
        console.log(`[updateDailyQuest] Updated dailyQuestCompletions for ${questType}:`, user.dailyQuestCompletions[today]);
      }
      
      // Update questStats
      if (!user.questStats) {
        user.questStats = {
          totalQuestsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastQuestDate: null,
          stepGoalHistory: [],
          proteinStreak: 0,
          proteinLongestStreak: 0,
          proteinLastCompletedDate: null,
          calorieStreak: 0,
          calorieLongestStreak: 0,
          calorieLastCompletedDate: null
        };
      }
      
      // Update totalQuestsCompleted
      user.questStats.totalQuestsCompleted = (user.questStats.totalQuestsCompleted || 0) + 1;
      user.markModified('questStats');
      
      // Update streak
      if (user.questStats.lastQuestDate === today) {
        // Already completed a quest today, don't change streak
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        
        if (user.questStats.lastQuestDate === yesterdayStr) {
          // Continuing streak
          user.questStats.currentStreak = (user.questStats.currentStreak || 0) + 1;
        } else {
          // New streak starts
          user.questStats.currentStreak = 1;
        }
        
        // Update longest streak
        if (user.questStats.currentStreak > (user.questStats.longestStreak || 0)) {
          user.questStats.longestStreak = user.questStats.currentStreak;
        }
        
        user.questStats.lastQuestDate = today;
      }
      
      console.log(`[updateDailyQuest] Updated questStats:`, {
        totalQuestsCompleted: user.questStats.totalQuestsCompleted,
        currentStreak: user.questStats.currentStreak,
        longestStreak: user.questStats.longestStreak,
        lastQuestDate: user.questStats.lastQuestDate
      });
      
      // Award XP and coins
      const xpGained = calculateQuestXP(questType);
      const coinsGained = calculateQuestCoins(questType);
      
      console.log(`[updateDailyQuest] Quest ${questType} completed! Progress: ${progress}`);
      console.log(`[updateDailyQuest] Awarding XP: ${xpGained}, Coins: ${coinsGained}`);
      console.log(`[updateDailyQuest] User coins before: ${user.coins}, after: ${(user.coins || 0) + coinsGained}`);
      
      user.exp = (user.exp || 0) + xpGained;
      user.coins = (user.coins || 0) + coinsGained;
      
      // Check for level up
      const oldLevel = user.level || 1;
      const newLevel = calculateLevel(user.exp);
      user.level = newLevel;
      
      if (newLevel > oldLevel) {
        // Add level up to activity log
        user.activityLog = user.activityLog || [];
        user.activityLog.unshift({
          type: 'levelup',
          date: new Date(),
          details: `Leveled up to ${newLevel}!`,
          xpGained: 0
        });
      }
      
      // Add quest completion to activity log
      user.activityLog = user.activityLog || [];
      user.activityLog.unshift({
        type: 'quest',
        questType: questType,
        date: new Date(),
        details: `Completed ${getQuestName(questType)}`,
        xpGained: xpGained
      });
      
      // Keep only last 20 activities
      user.activityLog = user.activityLog.slice(0, 20);
    
    // Save first to trigger the pre('save') middleware for streak calculation
    await user.save();
    
    // Check and unlock titles based on streaks (after streak calculation)
    console.log(`[updateDailyQuest] Before checkAndUnlockStreakTitles - questStats:`, user.questStats);
    unlockedTitles = await checkAndUnlockStreakTitles(user);
    console.log(`[updateDailyQuest] After checkAndUnlockStreakTitles - unlockedTitles:`, unlockedTitles);
    
    // Save again if titles were unlocked
    if (unlockedTitles.length > 0) {
        await user.save();
    }
    
    // Badge unlocks removed - only titles are used now
  } else if (completed === false && isRegularQuest) {
    // Handle quest uncompletion
    if (user.dailyQuestCompletions?.[today]?.[questType]) {
      delete user.dailyQuestCompletions[today][questType];
      user.markModified('dailyQuestCompletions');
      console.log(`[updateDailyQuest] Quest ${questType} unchecked`);
    }
  }
    
    console.log(`[updateDailyQuest] Quest saved. Final state: questType=${questType}, progress=${progress}, completed=${shouldComplete}, userCoins=${user.coins}`);
    console.log(`[updateDailyQuest] User questStats after save:`, {
      totalQuestsCompleted: user.questStats?.totalQuestsCompleted,
      currentStreak: user.questStats?.currentStreak,
      longestStreak: user.questStats?.longestStreak,
      lastQuestDate: user.questStats?.lastQuestDate
    });
    
    res.json({
      success: true,
      questType: questType,
      progress: progress,
      completed: shouldComplete,
      xp: user.exp,
      level: user.level,
      coins: user.coins,
      leveledUp: shouldComplete,
      unlockedTitles: unlockedTitles || [],
      questStats: user.questStats // Include updated quest stats
    });

  } catch (err) {
    console.error('Update daily quest error:', err);
    res.status(500).json({ error: 'Failed to update daily quest' });
  }
});

// GET daily quest completion status
router.get('/getDailyQuestStatus/:email', authenticateToken, async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date().toISOString().slice(0, 10);
    
    // Get today's quest completions
    const todayCompletions = user.dailyQuestCompletions?.[today] || {};
    
    // Define quest details
    const questDetails = {
      water: {
        name: 'Hydration Master',
        description: 'Log 2L water',
        xpReward: 25,
        icon: '💧'
      },
      sleep: {
        name: 'Sleep Warrior',
        description: 'Sleep 7+ hours',
        xpReward: 30,
        icon: '😴'
      },
      meal: {
        name: 'Nutrition Tracker',
        description: 'Log today\'s meal',
        xpReward: 20,
        icon: '🍽️'
      },
      exercise: {
        name: 'Fitness Fanatic',
        description: '30 min workout',
        xpReward: 60,
        icon: '💪'
      }
    };

    // Build response with completion status
    const questStatus = {};
    Object.keys(questDetails).forEach(questType => {
      questStatus[questType] = {
        ...questDetails[questType],
        completed: todayCompletions[questType] || false,
        completedAt: todayCompletions[questType] ? new Date().toISOString() : null
      };
    });

    res.json({
      success: true,
      date: today,
      quests: questStatus,
      totalCompleted: Object.values(todayCompletions).filter(Boolean).length,
      totalQuests: Object.keys(questDetails).length
    });

  } catch (err) {
    console.error('Get daily quest status error:', err);
    res.status(500).json({ error: 'Failed to get daily quest status' });
  }
});

// GET smart daily quest data (from food logs and user data)
router.get('/getSmartQuestData/:email', authenticateToken, async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date().toISOString().slice(0, 10);
    
    // Get food logs for today
    const foodLogs = await FoodLogModel.find({
      userId: user._id,
      date: today
    });

    // Calculate totals from food logs
    const todayTotals = foodLogs.reduce((totals, log) => {
      totals.calories += log.calories || 0;
      totals.protein += log.protein || 0;
      return totals;
    }, { calories: 0, protein: 0 });

    // dailyQuests removed - using questStats for tracking instead

    // Calculate dynamic goals based on user profile and recent performance
    const caloriesGoal = calculateCaloriesGoal(user);
    const proteinGoal = calculateProteinGoal(user);

    res.json({
      quests: {
        calories: {
          date: today,
          questType: 'calories',
          questName: 'Calorie Target',
          target: caloriesGoal,
          currentProgress: todayTotals.calories,
          completed: todayTotals.calories >= caloriesGoal
        },
        protein: {
          date: today,
          questType: 'protein',
          questName: 'Protein Power',
          target: proteinGoal,
          currentProgress: todayTotals.protein,
          completed: todayTotals.protein >= proteinGoal
        }
      },
      totals: todayTotals,
      user: {
        level: user.level || 1,
        xp: user.exp || 0,
        coins: user.coins || 0
      }
    });

  } catch (err) {
    console.error('Get smart quest data error:', err);
    res.status(500).json({ error: 'Failed to get smart quest data' });
  }
});

// POST unlock mini challenge
router.post('/unlockChallenge', authenticateToken, async (req, res) => {
  try {
    const { challengeId, cost } = req.body;
    console.log('[unlockChallenge] Request received:', { challengeId, cost, userId: req.user._id });
    
    // Validate input
    if (!challengeId || !cost) {
      return res.status(400).json({ error: 'Missing challengeId or cost' });
    }
    
    const user = await UserModel.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('[unlockChallenge] User found:', { userId: user._id, coins: user.coins, exp: user.exp });

    // Check if user has enough coins
    if ((user.coins || 0) < cost) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Check if challenge is already unlocked
    const existingChallenge = user.miniChallenges?.find(c => c.challengeId === challengeId);
    if (existingChallenge) {
      return res.status(400).json({ error: 'Challenge already unlocked' });
    }

    // Define challenge rewards (badges removed)
    const challengeRewards = {
      'night-walk': {
        xp: 20
      },
      'fruit-day': {
        xp: 30
      },
      'hydration-hero': {
        xp: 40
      }
    };

    const reward = challengeRewards[challengeId];
    if (!reward) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    // Deduct coins
    user.coins = (user.coins || 0) - cost;

    // Add XP
    user.exp = (user.exp || 0) + reward.xp;

    // Check for level up
    const oldLevel = user.level || 1;
    const newLevel = calculateLevel(user.exp);
    user.level = newLevel;

    // Add challenge to user's miniChallenges
    if (!user.miniChallenges) user.miniChallenges = [];
    
    // Define challenge names
    const challengeNames = {
      'night-walk': 'Night Walk',
      'fruit-day': 'Fruit Day',
      'hydration-hero': 'Hydration Hero'
    };
    
    user.miniChallenges.push({
      challengeId: challengeId,
      challengeName: challengeNames[challengeId] || challengeId,
      description: `Unlocked ${challengeNames[challengeId] || challengeId} challenge`,
      cost: cost,
      xpReward: reward.xp,
      status: 'unlocked',
      unlockedAt: new Date(),
      completed: false
    });
    console.log('[unlockChallenge] Challenge added to miniChallenges:', challengeId);

    // Badge addition removed - only titles are used now

    // Add to activity log
    if (!user.activityLog) user.activityLog = [];
    user.activityLog.unshift({
      type: 'challenge',
      date: new Date(),
      details: `Unlocked challenge: ${challengeId}`,
      xpGained: reward.xp,
      coinsSpent: cost
    });

    // Keep only last 20 activities
    user.activityLog = user.activityLog.slice(0, 20);

    await user.save();
    console.log('[unlockChallenge] Challenge unlocked successfully:', { challengeId, userCoins: user.coins, userExp: user.exp, userLevel: user.level });

    res.json({
      success: true,
      message: 'Challenge unlocked successfully',
      user: {
        coins: user.coins,
        exp: user.exp,
        level: user.level,
        leveledUp: newLevel > oldLevel
      },
      challenge: {
        challengeId: challengeId,
        // Badge removed from response
      }
    });

  } catch (err) {
    console.error('[unlockChallenge] Error:', err);
    console.error('[unlockChallenge] Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to unlock challenge', details: err.message });
  }
});

// unlockBadge route removed - only titles are used now

// POST unlock title with coins
router.post('/unlockTitle', authenticateToken, async (req, res) => {
  try {
    const { titleId, cost } = req.body;
    const user = await UserModel.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if ((user.coins || 0) < cost) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Check if title already unlocked
    if (user.titles && user.titles.some(t => t.titleId === titleId)) {
      return res.status(400).json({ error: 'Title already unlocked' });
    }

    // Deduct coins and add title
    user.coins = (user.coins || 0) - cost;
    user.titles = user.titles || [];
    user.titles.push({
      titleId: titleId,
      title: getTitleName(titleId),
      unlockedAt: new Date()
    });

    // Add to activity log
    user.activityLog = user.activityLog || [];
    user.activityLog.unshift({
      type: 'title',
      date: new Date(),
      details: `Unlocked "${getTitleName(titleId)}" title`,
      coinsSpent: cost
    });

    await user.save();

    res.json({
      success: true,
      coins: user.coins,
      titles: user.titles
    });

  } catch (err) {
    console.error('Unlock title error:', err);
    res.status(500).json({ error: 'Failed to unlock title' });
  }
});

// setActiveBadge route removed - only titles are used now

// PATCH set active title
router.patch('/setActiveTitle', authenticateToken, async (req, res) => {
  try {
    const { titleId } = req.body;
    const user = await UserModel.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.titles || !user.titles.some(t => t.titleId === titleId)) {
      return res.status(400).json({ error: 'Title not unlocked' });
    }

    user.activeTitle = titleId;
    await user.save();

    res.json({ success: true, activeTitle: user.activeTitle });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set active title' });
  }
});

// PUT update user
router.put('/updateUser/:email', async (req, res) => {
  try {
    const currentEmail = req.params.email.toLowerCase();
    const updateData = { ...req.body };

    if (
      (updateData.hasOwnProperty('email') && !updateData.email) ||
      (updateData.hasOwnProperty('password') && !updateData.password) ||
      (updateData.hasOwnProperty('profileName') && !updateData.profileName)
    ) {
      return res.status(400).json({ error: 'Cannot remove required fields: email, password, or profileName.' });
    }

    // Check for username uniqueness if username is being updated
    if (updateData.username) {
      const existingUserWithUsername = await UserModel.findOne({ 
        username: updateData.username,
        email: { $ne: currentEmail } // Exclude current user
      });
      
      if (existingUserWithUsername) {
        return res.status(400).json({ error: 'Username already taken. Please choose a different username.' });
      }
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
    console.error('Update user error:', err);
    if (err.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({ error: 'Username already taken. Please choose a different username.' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH update user data (coins, titles, activityLog, badges, etc.)
router.patch('/updateUser', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    
    console.log('[UPDATE USER] Request received for user:', userId);
    console.log('[UPDATE USER] Request body keys:', Object.keys(updateData));
    console.log('[UPDATE USER] Update data:', JSON.stringify(updateData, null, 2));
    // Badge logging removed - only titles are used now
    
    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      console.log('[UPDATE USER] User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Badge logging removed - only titles are used now

    // Update allowed fields
    if (updateData.coins !== undefined) {
      user.coins = updateData.coins;
      console.log('[UPDATE USER] Updated coins to:', updateData.coins);
    }
    if (updateData.exp !== undefined) {
      user.exp = updateData.exp;
      user.level = calculateLevel(updateData.exp);
      console.log('[UPDATE USER] Updated exp to:', updateData.exp, 'and level to:', user.level);
    }
    if (updateData.titles !== undefined) {
      user.titles = updateData.titles;
      console.log('[UPDATE USER] Updated titles to:', updateData.titles);
    }
    if (updateData.selectedTitle !== undefined) {
      user.selectedTitle = updateData.selectedTitle;
      console.log('[UPDATE USER] Updated selectedTitle to:', updateData.selectedTitle);
    }
    // Badge update removed - only titles are used now
    if (updateData.activityLog !== undefined) {
      user.activityLog = updateData.activityLog;
      console.log('[UPDATE USER] Updated activityLog');
    }
    if (updateData.questStats !== undefined) {
      user.questStats = updateData.questStats;
      console.log('[UPDATE USER] Updated questStats');
    }
    // dailyQuests removed - using questStats for tracking instead
    if (updateData.miniChallenges !== undefined) {
      user.miniChallenges = updateData.miniChallenges;
      console.log('[UPDATE USER] Updated miniChallenges');
    }
    if (updateData.selectedTitle !== undefined) {
      user.selectedTitle = updateData.selectedTitle;
      console.log('[UPDATE USER] Updated selectedTitle to:', updateData.selectedTitle);
    }
    // selectedBadge update removed - only titles are used now

    // Badge logging removed - only titles are used now

    // Save the updated user
    try {
      await user.save();
      console.log('[UPDATE USER] User saved successfully');
    } catch (saveError) {
      console.error('[UPDATE USER] Save error:', saveError);
      console.error('[UPDATE USER] Save error message:', saveError.message);
      if (saveError.errors) {
        Object.keys(saveError.errors).forEach(key => {
          console.error(`[UPDATE USER] Validation error for ${key}:`, saveError.errors[key].message);
        });
      }
      return res.status(400).json({ error: 'Validation error', details: saveError.message });
    }

    // Badge verification removed - only titles are used now

    // Return updated user data (excluding password)
    const updatedUser = await UserModel.findById(userId).select('-password');
    res.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    });

  } catch (err) {
    console.error('[UPDATE USER] Error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH claim smart quest reward
router.patch('/claimSmartQuestReward', authenticateToken, async (req, res) => {
  try {
    const { questType } = req.body; // 'steps', 'calories', or 'protein'
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().slice(0, 10);

    // Find or create a record for claimed smart quest rewards
    if (!user.smartQuestClaims) user.smartQuestClaims = {};
    if (!user.smartQuestClaims[today]) user.smartQuestClaims[today] = {};

    // Prevent double-claiming
    if (user.smartQuestClaims[today][questType]) {
      return res.status(400).json({ error: 'Reward already claimed for this smart quest today.' });
    }

    // Get today's smart quest progress
    let progress = 0, target = 0;
    if (questType === 'calories' || questType === 'protein') {
      // Aggregate from food logs
      const FoodLogModel = require('../models/FoodLogModel');
      const foodLogs = await FoodLogModel.find({ userId: user._id, date: today });
      if (questType === 'calories') {
        progress = foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
        target = calculateCaloriesGoal(user);
      } else {
        progress = foodLogs.reduce((sum, log) => sum + (log.protein || 0), 0);
        target = calculateProteinGoal(user);
      }
    } else {
      return res.status(400).json({ error: 'Invalid smart quest type.' });
    }

    if (progress < target) {
      return res.status(400).json({ error: 'Smart quest not completed yet.' });
    }

    // Award coins/XP
    const xpGained = calculateQuestXP(questType);
    const coinsGained = calculateQuestCoins(questType);
    user.exp = (user.exp || 0) + xpGained;
    user.coins = (user.coins || 0) + coinsGained;
    
    // Update smart quest claims and mark as modified
    if (!user.smartQuestClaims) user.smartQuestClaims = {};
    if (!user.smartQuestClaims[today]) user.smartQuestClaims[today] = {};
    user.smartQuestClaims[today][questType] = true;
    user.markModified('smartQuestClaims'); // Explicitly mark as modified

    console.log(`[CLAIM REWARD] Before save - smartQuestClaims:`, user.smartQuestClaims);
    console.log(`[CLAIM REWARD] Before save - questStats:`, user.questStats);

    // Save first to trigger the pre('save') middleware for streak calculation
    await user.save();

    // Check and unlock titles based on streaks (after streak calculation)
    const unlockedTitles = await checkAndUnlockStreakTitles(user);

    // Save again if titles were unlocked
    if (unlockedTitles.length > 0) {
        await user.save();
    }
    
    console.log(`[CLAIM REWARD] After save - questStats:`, user.questStats);
    res.json({
      success: true,
      xp: user.exp,
      coins: user.coins,
      questType,
      xpGained,
      coinsGained,
      unlockedTitles: unlockedTitles,
      questStats: user.questStats // Include updated quest stats
    });

  } catch (err) {
    console.error('Claim smart quest reward error:', err);
    res.status(500).json({ error: 'Failed to claim smart quest reward' });
  }
});

// updateUserBadges route removed - only titles are used now

// Helper Functions
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

function calculateQuestXP(questType) {
  const xpRewards = {
    'calories': 30,
    'protein': 25,
    'water': 20,
    'sleep': 35,
    'exercise': 40
  };
  return xpRewards[questType] || 10;
}

function calculateQuestCoins(questType) {
  const coinRewards = {
    'calories': 10,
    'protein': 8,
    'water': 5,
    'sleep': 12,
    'exercise': 18,
    'meal': 5
  };
  const coins = coinRewards[questType] || 5;
  console.log(`[calculateQuestCoins] Quest: ${questType}, Coins: ${coins}`);
  return coins;
}

function getQuestName(questType) {
  const names = {
    'steps': 'Step Challenge',
    'calories': 'Calorie Target',
    'protein': 'Protein Power',
    'water': 'Hydration Hero',
    'sleep': 'Sleep Master',
    'exercise': 'Fitness Champion'
  };
  return names[questType] || 'Daily Quest';
}

function getQuestTarget(questType, user) {
  switch (questType) {
    case 'steps':
      return 10000; // Default, will be calculated dynamically
    case 'calories':
      return calculateCaloriesGoal(user);
    case 'protein':
      return calculateProteinGoal(user);
    case 'water':
      return user.waterIntake || 8;
    case 'sleep':
      return user.averageSleep || 8;
    case 'exercise':
      return 30; // 30 minutes
    default:
      return 1;
  }
}



function calculateCaloriesGoal(user) {
  // Basic calculation based on user profile
  let bmr = 1800; // Default BMR
  
  if (user.gender === 'male') {
    bmr = 88.362 + (13.397 * (user.weight || 70)) + (4.799 * (user.height || 170)) - (5.677 * (user.age || 25));
  } else if (user.gender === 'female') {
    bmr = 447.593 + (9.247 * (user.weight || 60)) + (3.098 * (user.height || 160)) - (4.330 * (user.age || 25));
  }
  
  // Activity level multiplier
  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
  };
  
  const multiplier = activityMultipliers[user.activityLevel] || 1.4;
  return Math.round(bmr * multiplier);
}

function calculateProteinGoal(user) {
  const weight = user.weight || 70;
  // 1.2-2.2g per kg depending on activity level and goals
  if (user.primaryGoal === 'muscle_gain') {
    return Math.round(weight * 2.0);
  } else if (user.primaryGoal === 'weight_loss') {
    return Math.round(weight * 1.6);
  }
  return Math.round(weight * 1.2);
}

// getBadgeTitle function removed - only titles are used now

function getTitleName(titleId) {
  const titles = {
    
    'meal-master': 'Meal Master',
    'strength-warrior': 'Strength Warrior',
    'cardio-king': 'Cardio King',
    'yoga-guru': 'Yoga Guru',
    'nutrition-expert': 'Nutrition Expert',
    'consistency-champion': 'Consistency Champion',
    'goal-crusher': 'Goal Crusher',
    'fitness-legend': 'Fitness Legend',
    'wellness-guru': 'Wellness Guru',
    'protein-beast': 'Protein Beast',
    'streak-legend': 'Streak Legend'
  };
  return titles[titleId] || 'Unknown Title';
}

// Function to check and unlock titles based on streaks
async function checkAndUnlockStreakTitles(user) {
  console.log(`[checkAndUnlockStreakTitles] Starting with questStats:`, user.questStats);
  const unlockedTitles = [];
  
  // Check for Streak Legend title (7+ days overall quest streak)
  if (user.questStats && user.questStats.longestStreak >= 7) {
    const streakLegendTitle = 'streak-legend';
    if (!user.titles || !user.titles.some(t => t.titleId === streakLegendTitle)) {
      user.titles = user.titles || [];
      user.titles.push({
        titleId: streakLegendTitle,
        title: getTitleName(streakLegendTitle),
        unlockedAt: new Date(),
        unlockedBy: 'streak_achievement'
      });
      unlockedTitles.push(streakLegendTitle);
      
      // Add to activity log
      user.activityLog = user.activityLog || [];
      user.activityLog.unshift({
        type: 'title',
        date: new Date(),
        details: `Unlocked "${getTitleName(streakLegendTitle)}" title for ${user.questStats.longestStreak} day streak!`,
        unlockedBy: 'streak_achievement'
      });
    }
  }
  
  // Check for Protein Master title (5+ days protein streak)
  if (user.questStats && user.questStats.proteinLongestStreak >= 5) {
    const proteinMasterTitle = 'protein-beast';
    if (!user.titles || !user.titles.some(t => t.titleId === proteinMasterTitle)) {
      user.titles = user.titles || [];
      user.titles.push({
        titleId: proteinMasterTitle,
        title: getTitleName(proteinMasterTitle),
        unlockedAt: new Date(),
        unlockedBy: 'protein_streak_achievement'
      });
      unlockedTitles.push(proteinMasterTitle);
      
      // Add to activity log
      user.activityLog = user.activityLog || [];
      user.activityLog.unshift({
        type: 'title',
        date: new Date(),
        details: `Unlocked "${getTitleName(proteinMasterTitle)}" title for ${user.questStats.proteinLongestStreak} day protein streak!`,
        unlockedBy: 'protein_streak_achievement'
      });
    }
  }
  
  // Check for Calorie Master title (5+ days calorie streak)
  if (user.questStats && user.questStats.calorieLongestStreak >= 5) {
    const calorieMasterTitle = 'nutrition-expert'; // Using existing nutrition-expert title for calorie mastery
    if (!user.titles || !user.titles.some(t => t.titleId === calorieMasterTitle)) {
      user.titles = user.titles || [];
      user.titles.push({
        titleId: calorieMasterTitle,
        title: getTitleName(calorieMasterTitle),
        unlockedAt: new Date(),
        unlockedBy: 'calorie_streak_achievement'
      });
      unlockedTitles.push(calorieMasterTitle);
      
      // Add to activity log
      user.activityLog = user.activityLog || [];
      user.activityLog.unshift({
        type: 'title',
        date: new Date(),
        details: `Unlocked "${getTitleName(calorieMasterTitle)}" title for ${user.questStats.calorieLongestStreak} day calorie streak!`,
        unlockedBy: 'calorie_streak_achievement'
      });
    }
  }
  
  if (unlockedTitles.length > 0) {
    await user.save();
    console.log(`[TITLE UNLOCK] Unlocked titles for user ${user.email}:`, unlockedTitles);
  }
  
  return unlockedTitles;
}

// checkAndUnlockBadges function removed - only titles are used now

// resetDailyQuests function removed - dailyQuests no longer used

module.exports = router;