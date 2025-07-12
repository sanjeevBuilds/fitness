const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  title: String,
  unlockedAt: Date,
  earnedBy: String
}, { _id: false });

module.exports = BadgeSchema; 