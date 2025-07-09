const mongoose = require('mongoose');

const MiniChallengeSchema = new mongoose.Schema({
  challengeName: String,
  refreshedAt: Date,
  expiresAt: Date,
  status: { type: String, enum: ['active', 'expired'], default: 'active' }
}, { _id: false });

module.exports = MiniChallengeSchema; 