const mongoose = require('mongoose');
const FoodLogSchema = require('./FoodLog');

const FoodLogModel = mongoose.model('FoodLog', FoodLogSchema);

module.exports = FoodLogModel; 