const mongoose = require('mongoose');

const FriendRequestSchema = new mongoose.Schema({
  email: String,
  profileName: String,
  avatar: String,
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  sentAt: { type: Date, default: Date.now }
}, { _id: false });

module.exports = FriendRequestSchema; 