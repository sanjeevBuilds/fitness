const mongoose = require('mongoose');

const MealPlanSchema = new mongoose.Schema({
  breakfast: [String],
  lunch: [String],
  dinner: [String]
}, { _id: false });

module.exports = MealPlanSchema; 