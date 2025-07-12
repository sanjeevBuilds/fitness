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
})