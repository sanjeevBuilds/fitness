const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  name: String,
  items: [String],
  totalCalories: Number
}, { _id: false });

const FoodLogSchema = new mongoose.Schema({
  date: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  meals: [MealSchema]
}, { _id: false });

module.exports = FoodLogSchema; 