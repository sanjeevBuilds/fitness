const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  badgeId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'], 
    default: 'common' 
  },
  unlockedAt: { type: Date, default: Date.now },
  earnedBy: { 
    type: String, 
    enum: ['achievement', 'purchase', 'quest', 'challenge', 'title'], // added 'title'
    default: 'achievement'
  }
}, { _id: false });

module.exports = BadgeSchema; 