const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FoodLogModel = require('../models/FoodLogModel');
const jwt = require('jsonwebtoken');

// Add a food log entry to the user's foodLogs array
router.post('/add', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    const userId = decoded._id;

    const { foodLog } = req.body;
    console.log('Received food log request:', { userId, foodLog });
    
    if (!userId || !foodLog) {
      console.log('Missing data:', { userId: !!userId, foodLog: !!foodLog });
      return res.status(400).json({ error: 'Missing userId or foodLog' });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found:', user.email);

    // Add to user's foodLogs array (for backward compatibility)
    // Add userId to the foodLog before pushing to ensure validation passes
    const foodLogWithUserId = {
      ...foodLog,
      userId: userId
    };
    
    await User.findByIdAndUpdate(
      userId,
      { $push: { foodLogs: foodLogWithUserId } },
      { new: true }
    );

    // Also save to separate FoodLog collection for better querying
    const newFoodLog = new FoodLogModel({
      userId: userId,
      date: foodLog.date,
      calories: foodLog.calories || 0,
      protein: foodLog.protein || 0,
      carbs: foodLog.carbs || 0,
      fat: foodLog.fat || 0,
      meals: foodLog.meals || []
    });

    console.log('Saving food log to collection:', {
      userId: newFoodLog.userId,
      date: newFoodLog.date,
      calories: newFoodLog.calories,
      protein: newFoodLog.protein
    });

    const savedFoodLog = await newFoodLog.save();
    console.log('Food log saved successfully with ID:', savedFoodLog._id);
    console.log('Saved food log data:', {
      userId: savedFoodLog.userId,
      date: savedFoodLog.date,
      calories: savedFoodLog.calories,
      protein: savedFoodLog.protein,
      _id: savedFoodLog._id
    });

    res.json({ 
      success: true, 
      message: 'Food log saved successfully',
      foodLogId: newFoodLog._id 
    });
  } catch (err) {
    console.error('Error saving food log:', err);
    if (err.name === 'ValidationError') {
      console.error('Validation errors:', err.errors);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: Object.keys(err.errors).map(key => err.errors[key].message)
      });
    }
    res.status(500).json({ error: 'Failed to save food log', details: err.message });
  }
});

// Get food logs for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    let query = { userId };
    if (date) {
      query.date = date;
    }

    const foodLogs = await FoodLogModel.find(query).sort({ createdAt: -1 });
    res.json(foodLogs);
  } catch (err) {
    console.error('Error fetching food logs:', err);
    res.status(500).json({ error: 'Failed to fetch food logs' });
  }
});

// Get daily totals for a user
router.get('/daily-totals/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const foodLogs = await FoodLogModel.find({ userId, date });
    
    const totals = foodLogs.reduce((acc, log) => {
      acc.calories += log.calories || 0;
      acc.protein += log.protein || 0;
      acc.carbs += log.carbs || 0;
      acc.fat += log.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    res.json(totals);
  } catch (err) {
    console.error('Error calculating daily totals:', err);
    res.status(500).json({ error: 'Failed to calculate daily totals' });
  }
});

// Migration: Clean up old food logs without userId
router.post('/migrate-foodlogs', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    const userId = decoded._id;

    // Find user and clean up old food logs
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter out food logs without userId and add userId to valid ones
    const cleanedFoodLogs = user.foodLogs.map(log => {
      if (!log.userId) {
        return { ...log, userId: userId };
      }
      return log;
    }).filter(log => log.userId); // Remove any logs that still don't have userId

    // Update user with cleaned food logs
    user.foodLogs = cleanedFoodLogs;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Food logs migrated successfully',
      cleanedCount: cleanedFoodLogs.length
    });
  } catch (err) {
    console.error('Error migrating food logs:', err);
    res.status(500).json({ error: 'Failed to migrate food logs', details: err.message });
  }
});

// Delete a food log entry by ID
router.delete('/delete/:foodLogId', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    const userId = decoded._id;

    const { foodLogId } = req.params;
    console.log('Deleting food log:', { userId, foodLogId });

    // Remove from FoodLogModel collection
    const deleted = await FoodLogModel.findOneAndDelete({ _id: foodLogId, userId });
    if (!deleted) {
      console.log('Food log not found:', foodLogId);
      return res.status(404).json({ error: 'Food log not found' });
    }

    console.log('Food log deleted from collection:', deleted._id);

    // Remove from user's foodLogs array (backward compatibility)
    await User.findByIdAndUpdate(
      userId,
      { $pull: { foodLogs: { date: deleted.date } } }
    );

    console.log('Food log removed from user array');

    res.json({ 
      success: true, 
      message: 'Food log deleted successfully',
      deletedFoodLog: {
        id: deleted._id,
        date: deleted.date,
        calories: deleted.calories,
        protein: deleted.protein
      }
    });
  } catch (err) {
    console.error('Error deleting food log:', err);
    res.status(500).json({ error: 'Failed to delete food log', details: err.message });
  }
});

module.exports = router;
