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
    
    // Search in profileName, username, and email fields
    const users = await UserModel.find({
      $or: [
        { profileName: { $regex: searchQuery, $options: 'i' } },
        { username: { $regex: searchQuery, $options: 'i' } },
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
      req => req.fromEmail === fromEmail.toLowerCase()
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
      fromEmail: fromEmail.toLowerCase(),
      fromProfileName: fromProfileName,
      fromAvatar: fromAvatar,
      sentAt: new Date(),
      status: 'pending'
    };

    if (!recipient.friendRequests) {
      recipient.friendRequests = [];
    }
    
    recipient.friendRequests.push(friendRequest);
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
      req => req.fromEmail === fromEmail.toLowerCase()
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const friendRequest = recipient.friendRequests[requestIndex];
    recipient.friendRequests.splice(requestIndex, 1);

    if (action === 'accept') {
      // Add to friends list for both users
      const recipientFriend = {
        email: sender.email,
        profileName: sender.profileName,
        avatar: sender.avatar,
        level: sender.level,
        exp: sender.exp,
        addedAt: new Date()
      };

      const senderFriend = {
        email: recipient.email,
        profileName: recipient.profileName,
        avatar: recipient.avatar,
        level: recipient.level,
        exp: recipient.exp,
        addedAt: new Date()
      };

      if (!recipient.friends) recipient.friends = [];
      if (!sender.friends) sender.friends = [];

      recipient.friends.push(recipientFriend);
      sender.friends.push(senderFriend);
    } else if (action === 'reject') {
      // Remove the sent request from sender's cooldown list to allow resending
      if (sender.sentFriendRequests) {
        sender.sentFriendRequests = sender.sentFriendRequests.filter(
          req => req.toEmail !== recipient.email.toLowerCase()
        );
      }
    }

    await recipient.save();
    await sender.save();

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
    newUser.dailyQuests = [];
    newUser.miniChallenges = [];
    newUser.foodLogs = [];
    newUser.mealPlan = undefined;
    newUser.postureScans = [];
    newUser.insights = [];
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
    await resetDailyQuests(user);
    
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

// PATCH update daily quest progress
router.patch('/updateDailyQuest', authenticateToken, async (req, res) => {
  try {
    const { questType, progress, completed } = req.body;
    console.log(`[updateDailyQuest] Request received: questType=${questType}, progress=${progress}, completed=${completed}`);
    
    const user = await UserModel.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date().toISOString().slice(0, 10);
    let quest = user.dailyQuests.find(q => q.date === today && q.questType === questType);

    if (!quest) {
      // Create new quest if it doesn't exist
      quest = {
        date: today,
        questType: questType,
        questName: getQuestName(questType),
        target: getQuestTarget(questType, user),
        currentProgress: 0,
        completed: false
      };
      user.dailyQuests.push(quest);
    }

    // Update quest progress
    if (progress !== undefined) {
      quest.currentProgress = progress;
    }

    // NEW LOGIC: Reset quest completion if toggled OFF
    if (completed === false && quest.completed) {
      quest.completed = false;
      // Optionally, you could also reset currentProgress if you want
      // quest.currentProgress = 0;
      console.log(`[updateDailyQuest] Quest ${questType} reset to not completed.`);
    }

    // Check if quest should be completed
    // For regular quests (water, sleep, exercise, etc.), progress of 1 means completed
    // For smart quests (calories, protein), check if progress >= target
    const isRegularQuest = ['water', 'sleep', 'exercise', 'posture', 'meal'].includes(questType);
    const shouldComplete = isRegularQuest ? 
      (quest.currentProgress >= 1) : 
      (quest.currentProgress >= quest.target);
    
    if (shouldComplete && !quest.completed) {
      quest.completed = true;
      quest.completedAt = new Date();
      
      console.log(`[updateDailyQuest] Marking quest as completed: ${questType}, progress: ${quest.currentProgress}, target: ${quest.target}`);
      
      // Award XP and coins
      const xpGained = calculateQuestXP(questType);
      const coinsGained = calculateQuestCoins(questType);
      
      console.log(`[updateDailyQuest] Quest ${questType} completed! Progress: ${quest.currentProgress}, Target: ${quest.target}`);
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
        details: `Completed ${quest.questName}`,
        xpGained: xpGained
      });
      
      // Keep only last 20 activities
      user.activityLog = user.activityLog.slice(0, 20);
      
          // Badge unlocks removed - only titles are used now
    }

    await user.save();
    
    console.log(`[updateDailyQuest] Quest saved. Final state: questType=${quest.questType}, progress=${quest.currentProgress}, completed=${quest.completed}, userCoins=${user.coins}`);
    console.log(`[updateDailyQuest] User questStats after save:`, {
      totalQuestsCompleted: user.questStats?.totalQuestsCompleted,
      currentStreak: user.questStats?.currentStreak,
      longestStreak: user.questStats?.longestStreak,
      lastQuestDate: user.questStats?.lastQuestDate
    });
    console.log(`[updateDailyQuest] Total dailyQuests in DB: ${user.dailyQuests.length}, Completed: ${user.dailyQuests.filter(q => q.completed).length}`);
    
    res.json({
      success: true,
      quest: quest,
      xp: user.exp,
      level: user.level,
      coins: user.coins,
      leveledUp: quest.completed
    });

  } catch (err) {
    console.error('Update daily quest error:', err);
    res.status(500).json({ error: 'Failed to update daily quest' });
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

    // Get daily quests for today
    const todayQuests = user.dailyQuests.filter(q => q.date === today);

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
    // Badge update removed - only titles are used now
    if (updateData.activityLog !== undefined) {
      user.activityLog = updateData.activityLog;
      console.log('[UPDATE USER] Updated activityLog');
    }
    if (updateData.questStats !== undefined) {
      user.questStats = updateData.questStats;
      console.log('[UPDATE USER] Updated questStats');
    }
    if (updateData.dailyQuests !== undefined) {
      user.dailyQuests = updateData.dailyQuests;
      console.log('[UPDATE USER] Updated dailyQuests');
    }
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
    user.smartQuestClaims[today][questType] = true;

    // Save and respond
    await user.save();
    res.json({
      success: true,
      xp: user.exp,
      coins: user.coins,
      questType,
      xpGained,
      coinsGained
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
    'exercise': 40,
    'posture': 30
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
    'posture': 10,
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
    'exercise': 'Fitness Champion',
    'posture': 'Posture Pro'
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
    'fitness-novice': 'Fitness Novice',
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

// checkAndUnlockBadges function removed - only titles are used now

async function resetDailyQuests(user) {
  const today = new Date().toISOString().slice(0, 10);
  const existingQuests = user.dailyQuests.filter(q => q.date === today);
  
  // If no quests exist for today, create default ones
  if (existingQuests.length === 0) {
    const defaultQuests = [
      {
        date: today,
        questType: 'water',
        questName: 'Hydration Hero',
        target: user.waterIntake || 8,
        currentProgress: 0,
        completed: false
      },
      {
        date: today,
        questType: 'sleep',
        questName: 'Sleep Master',
        target: user.averageSleep || 8,
        currentProgress: 0,
        completed: false
      },
      {
        date: today,
        questType: 'exercise',
        questName: 'Fitness Champion',
        target: 30,
        currentProgress: 0,
        completed: false
      }
    ];
    
    user.dailyQuests.push(...defaultQuests);
    await user.save();
  }
}

module.exports = router;