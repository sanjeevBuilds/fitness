const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  date: String,
  metric: String,
  value: mongoose.Schema.Types.Mixed
}, { _id: false });

module.exports = InsightSchema; 