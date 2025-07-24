const mongoose = require('mongoose');

const TitleSchema = new mongoose.Schema({
  titleId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'], 
    default: 'common' 
  },
  unlockedAt: { type: Date, default: Date.now },
  requirements: { type: String } // Description of how to earn it
}, { _id: false });

module.exports = TitleSchema;
