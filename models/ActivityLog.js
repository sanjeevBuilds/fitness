const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['quest', 'levelup', 'badge', 'title', 'challenge', 'purchase', 'achievement']
  },
  questType: { type: String }, // For quest-specific activities
  date: { type: Date, default: Date.now },
  details: { type: String, required: true },
  xpGained: { type: Number, default: 0 },
  coinsGained: { type: Number, default: 0 },
  coinsSpent: { type: Number, default: 0 }
}, { _id: false });

module.exports = ActivityLogSchema;
