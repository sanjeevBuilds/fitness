
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const NotificationSchema = require('./Notification');
const FriendRequestSchema = require('./FriendRequest');
const FoodLogSchema = require('./FoodLog');
const MealPlanSchema = require('./MealPlan');
const PostureScanSchema = require('./PostureScan');
const InsightSchema = require('./Insight');
const DailyQuestSchema = require('./DailyQuest');
const MiniChallengeSchema = require('./MiniChallenge');
const BadgeSchema = require('./Badge');
const TitleSchema = require('./Tittle');
const ActivityLogSchema = require('./ActivityLog');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profileName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Profile name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: 'avator1.jpeg'
  },
  
  // Gamification Fields
  exp: {
    type: Number,
    default: 0,
    min: [0, 'Experience cannot be negative']
  },
  level: {
    type: Number,
    default: 1,
    min: [1, 'Level cannot be less than 1']
  },
  coins: {
    type: Number,
    default: 0,
    min: [0, 'Coins cannot be negative']
  },
  badges: [BadgeSchema], // Enhanced badge system
  activeBadge: {
    type: String,
    default: ''
  },
  titles: [TitleSchema], // Enhanced title system
  activeTitle: {
    type: String,
    default: ''
  },
  activityLog: [ActivityLogSchema], // Enhanced activity log
  
  // Smart Quest Reward Claims (per day, per questType)
  smartQuestClaims: {
    type: mongoose.Schema.Types.Mixed, // { 'YYYY-MM-DD': { steps: true, calories: true, protein: true } }
    default: {}
  },
  // Quest Progress Tracking
  questStats: {
    totalQuestsCompleted: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastQuestDate: { type: String }, // YYYY-MM-DD format
    stepGoalHistory: [{ date: String, goal: Number, achieved: Number }] // For smart scaling
  },
  
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  
  // Personal Details
  fullName: {
    type: String,
    trim: true,
    default: ''
  },
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age cannot exceed 120'],
    default: null
  },
  gender: {
    type: String,
    trim: true,
    default: ''
  },
  height: {
    type: Number, // in cm
    min: [100, 'Height must be at least 100cm'],
    max: [250, 'Height cannot exceed 250cm'],
    default: null
  },
  weight: {
    type: Number, // in kg
    min: [30, 'Weight must be at least 30kg'],
    max: [300, 'Weight cannot exceed 300kg'],
    default: null
  },
  primaryGoal: {
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'control_diet', 'fitness'],
    default: ''
  },
  
  // Lifestyle Habits
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'very'],
    default: ''
  },
  averageSleep: {
    type: Number, // hours per day
    min: [4, 'Sleep must be at least 4 hours'],
    max: [16, 'Sleep cannot exceed 16 hours'],
    default: null
  },
  waterIntake: {
    type: Number, // liters per day
    min: [0.5, 'Water intake must be at least 0.5L'],
    max: [10, 'Water intake cannot exceed 10L'],
    default: null
  },
  mealFrequency: {
    type: String,
    enum: ['2', '3', '4+'],
    default: ''
  },
  
  // Dietary Preferences
  dietType: {
    type: String,
    enum: ['vegetarian', 'vegan', 'keto', 'balanced', 'paleo', 'other'],
    default: ''
  },
  allergies: {
    type: [String],
    enum: ['none', 'nuts', 'gluten', 'dairy', 'soy', 'seafood', 'multiple'],
    default: []
  },
  dietaryNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Dietary notes cannot exceed 500 characters'],
    default: ''
  },
  
  // Account Preferences
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  notificationPreference: {
    type: String,
    enum: ['all', 'important', 'none'],
    default: ''
  },
  
  // Health Metrics
  bmi: {
    type: Number,
    min: [10, 'BMI must be at least 10'],
    max: [60, 'BMI cannot exceed 60'],
    default: null
  },
  targetWeight: {
    type: Number,
    min: [30, 'Target weight must be at least 30kg'],
    max: [300, 'Target weight cannot exceed 300kg'],
    default: null
  },
  
  // Progress Tracking
  startDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Subdocuments
  notifications: [NotificationSchema],
  friendRequests: [FriendRequestSchema],
  dailyQuests: [DailyQuestSchema], // Enhanced daily quests
  miniChallenges: [MiniChallengeSchema], // Enhanced mini challenges
  foodLogs: [FoodLogSchema],
  mealPlan: MealPlanSchema,
  postureScans: [PostureScanSchema],
  insights: [InsightSchema],
  friends: [{
    email: String,
    profileName: String,
    avatar: String,
    level: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate BMI before saving
UserSchema.pre('save', function(next) {
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = Math.round((this.weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  next();
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Calculate level based on experience before saving
UserSchema.pre('save', function(next) {
  if (this.isModified('exp')) {
    const exp = this.exp;
    let level = 1;
    
    if (exp >= 100 && exp < 300) level = 2;
    else if (exp >= 300 && exp < 600) level = 3;
    else if (exp >= 600 && exp < 1000) level = 4;
    else if (exp >= 1000 && exp < 1500) level = 5;
    else if (exp >= 1500 && exp < 2100) level = 6;
    else if (exp >= 2100 && exp < 2800) level = 7;
    else if (exp >= 2800 && exp < 3600) level = 8;
    else if (exp >= 3600 && exp < 4500) level = 9;
    else if (exp >= 4500) level = Math.floor((exp - 4500) / 1000) + 10;
    
    this.level = level;
  }
  next();
});

// Add userId to food logs that don't have it
UserSchema.pre('save', function(next) {
  if (this.isModified('foodLogs')) {
    // Ensure foodLogs is an array
    if (!Array.isArray(this.foodLogs)) {
      this.foodLogs = [];
    }
    
    // Filter out null or non-object entries
    this.foodLogs = this.foodLogs.filter(log => log && typeof log === 'object');
    
    // Add userId to food logs that don't have it
    this.foodLogs.forEach(log => {
      if (!log.userId) {
        log.userId = this._id;
      }
    });
    
    // Mark the foodLogs array as modified
    this.markModified('foodLogs');
  }
  next();
});

// Clean and populate userId after loading from database
UserSchema.post('init', function() {
  if (this.foodLogs && Array.isArray(this.foodLogs)) {
    // Filter out null or non-object entries
    this.foodLogs = this.foodLogs.filter(log => log && typeof log === 'object');
    
    // Add userId to food logs that don't have it
    this.foodLogs.forEach(log => {
      if (!log.userId) {
        log.userId = this._id;
      }
    });
  }
});

// Update quest stats when daily quests are modified
UserSchema.pre('save', function(next) {
  if (this.isModified('dailyQuests')) {
    const today = new Date().toISOString().slice(0, 10);
    const todayQuests = this.dailyQuests.filter(q => q.date === today);
    const completedToday = todayQuests.filter(q => q.completed).length;
    
    // Initialize questStats if it doesn't exist
    if (!this.questStats) {
      this.questStats = {
        totalQuestsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastQuestDate: null,
        stepGoalHistory: []
      };
    }
    
    // Update total completed quests
    this.questStats.totalQuestsCompleted = this.dailyQuests.filter(q => q.completed).length;
    
    // Update streak if quests completed today
    if (completedToday > 0) {
      if (this.questStats.lastQuestDate === today) {
        // Already updated today, don't change streak
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        
        if (this.questStats.lastQuestDate === yesterdayStr) {
          // Continuing streak
          this.questStats.currentStreak += 1;
        } else {
          // New streak starts
          this.questStats.currentStreak = 1;
        }
        
        // Update longest streak
        if (this.questStats.currentStreak > this.questStats.longestStreak) {
          this.questStats.longestStreak = this.questStats.currentStreak;
        }
        
        this.questStats.lastQuestDate = today;
      }
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);