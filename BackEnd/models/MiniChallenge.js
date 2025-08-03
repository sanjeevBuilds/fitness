const mongoose = require('mongoose');

const MiniChallengeSchema = new mongoose.Schema({
  challengeId: { type: String, required: true },
  challengeName: { type: String, required: true },
  description: { type: String },
  cost: { type: Number, required: true },
  xpReward: { type: Number, default: 0 },
  coinReward: { type: Number, default: 0 },
  badgeReward: { type: String },
  status: { 
    type: String, 
    enum: ['available', 'unlocked', 'completed', 'expired'], 
    default: 'available' 
  },
  unlockedAt: { type: Date },
  completedAt: { type: Date },
  expiresAt: { type: Date }
}, { _id: false });
module.exports = MiniChallengeSchema; 