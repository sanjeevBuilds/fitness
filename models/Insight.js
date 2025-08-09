const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [120, 'Title must be under 120 characters']
  },
  category: {
    type: String,
    enum: ['nutrition', 'fitness', 'wellness', 'mental_health', 'hydration', 'sleep', 'posture'],
    required: true
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [300, 'Summary cannot exceed 300 characters']
  },
  fullContent: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Content too long']
  },
  xpGained: {
    type: Number,
    default: 10,
    min: [0, 'XP cannot be negative']
  },
  coinsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Coins cannot be negative']
  },
  wasHelpful: {
    type: Boolean,
    default: false
  },
  liked: {
    type: Boolean,
    default: false
  },
  shared: {
    type: Boolean,
    default: false
  },
  viewed: {
    type: Boolean,
    default: false
  },
  linkedQuest: {
    type: String,
    default: '' // e.g., "read_insight_daily"
  },
  tags: {
    type: [String],
    enum: ['mindset', 'goal', 'habit', 'tips', 'facts', 'motivation', 'hydration', 'protein'],
    default: []
  },
  sourceURL: {
    type: String,
    trim: true,
    default: '',
    maxlength: [300, 'Source URL too long']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastViewedAt: {
    type: Date
  }
});

// Update lastViewedAt when viewed
InsightSchema.pre('save', function(next) {
  if (this.isModified('viewed') && this.viewed === true) {
    this.lastViewedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Insight', InsightSchema);
