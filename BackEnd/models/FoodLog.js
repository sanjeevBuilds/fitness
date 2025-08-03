const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  name: String,
  items: [String],
  totalCalories: Number
}, { _id: false });

const FoodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed to false for backward compatibility
  },
  date: {
    type: String,
    required: true
  },
  calories: {
    type: Number,
    default: 0
  },
  protein: {
    type: Number,
    default: 0
  },
  carbs: {
    type: Number,
    default: 0
  },
  fat: {
    type: Number,
    default: 0
  },
  meals: [MealSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = FoodLogSchema; 