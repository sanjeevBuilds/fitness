const mongoose = require('mongoose');

const NotificationSchema = require('./Notification');
const FriendRequestSchema = require('./FriendRequest');
const DailyQuestSchema = require('./DailyQuest');
const MiniChallengeSchema = require('./MiniChallenge');
const FoodLogSchema = require('./FoodLog');
const MealPlanSchema = require('./MealPlan');
const PostureScanSchema = require('./PostureScan');
const InsightSchema = require('./Insight');
const BadgeSchema = require('./Badge');

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
  exp: {
    type: Number,
    default: 0,
    min: [0, 'Experience cannot be negative']
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  
  // Personal Details (from ongoing1)
  fullName: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age cannot exceed 120']
  },
  gender: {
    type: String,
    trim: true
  },
  height: {
    type: Number, // in cm
    min: [100, 'Height must be at least 100cm'],
    max: [250, 'Height cannot exceed 250cm']
  },
  weight: {
    type: Number, // in kg
    min: [30, 'Weight must be at least 30kg'],
    max: [300, 'Weight cannot exceed 300kg']
  },
  primaryGoal: {
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'control_diet', 'fitness'],
    default: 'fitness'
  },
  
  // Lifestyle Habits (from ongoing2)
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'very'],
    default: 'moderate'
  },
  averageSleep: {
    type: Number, // hours per day
    min: [4, 'Sleep must be at least 4 hours'],
    max: [16, 'Sleep cannot exceed 16 hours']
  },
  waterIntake: {
    type: Number, // liters per day
    min: [0.5, 'Water intake must be at least 0.5L'],
    max: [10, 'Water intake cannot exceed 10L']
  },
  mealFrequency: {
    type: String,
    enum: ['2', '3', '4+'],
    default: '3'
  },
  
  // Dietary Preferences (from ongoing3)
  dietType: {
    type: String,
    enum: ['vegetarian', 'vegan', 'keto', 'balanced', 'paleo', 'other'],
    default: 'balanced'
  },
  allergies: {
    type: [String],
    enum: ['none', 'nuts', 'gluten', 'dairy', 'soy', 'seafood', 'multiple'],
    default: ['none']
  },
  dietaryNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Dietary notes cannot exceed 500 characters']
  },
  
  // Account Preferences (from ongoing4)
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  notificationPreference: {
    type: String,
    enum: ['all', 'important', 'none'],
    default: 'important'
  },
  
  // Health Metrics
  bmi: {
    type: Number,
    min: [10, 'BMI must be at least 10'],
    max: [60, 'BMI cannot exceed 60']
  },
  targetWeight: {
    type: Number,
    min: [30, 'Target weight must be at least 30kg'],
    max: [300, 'Target weight cannot exceed 300kg']
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
  dailyQuests: [DailyQuestSchema],
  miniChallenges: [MiniChallengeSchema],
  foodLogs: [FoodLogSchema],
  mealPlan: MealPlanSchema,
  postureScans: [PostureScanSchema],
  insights: [InsightSchema],
  badges: [BadgeSchema],
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

module.exports = mongoose.model('User', UserSchema);