const mongoose = require('mongoose');

const PostureScanSchema = new mongoose.Schema({
  date: String,
  result: String,
  notes: String
}, { _id: false });

module.exports = PostureScanSchema; 