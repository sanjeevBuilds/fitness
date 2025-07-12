const mongoose = require('mongoose');

const DailyQuestSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  stepsGoal: Number,
  stepsCompleted: Number,
  completed: Boolean
}, { _id: false });

module.exports = DailyQuestSchema; 