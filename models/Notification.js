const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['friend_request', 'challenge_unlocked', 'badge_earned', 'reminder'],
    required: true
  },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  fromUser: {
    email: String,
    profileName: String,
    avatar: String
  }
}, { _id: false });

module.exports = NotificationSchema; 