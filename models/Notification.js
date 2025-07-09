const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
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