const mongoose = require('mongoose');

// User Schema with validation
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model
module.exports = mongoose.model('User', UserSchema); 