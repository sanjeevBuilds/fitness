const mongoose = require('mongoose');

const DailyQuestSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD format
  questType: { 
    type: String, 
    required: true,
    enum: ['steps', 'calories', 'protein', 'water', 'sleep', 'exercise', 'posture', 'meal']
  },
  questName: { type: String, required: true },
  target: { type: Number, required: true },
  currentProgress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  xpAwarded: { type: Number, default: 0 },
  coinsAwarded: { type: Number, default: 0 }
}, { _id: false });

module.exports = DailyQuestSchema; 