const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FoodLogModel = require('../models/FoodLogModel');
const jwt = require('jsonwebtoken');
const https = require('https');

// Nutritionix API credentials for food search
const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID || '8faf5aed';
const NUTRITIONIX_APP_KEY = process.env.NUTRITIONIX_APP_KEY || '88409220ce915ba9f6416710b7c27c97';





// Fallback food database (free, no API key required)
const FALLBACK_FOODS = [
  { food_name: 'Apple', brand_name: 'Generic', serving_qty: 1, serving_unit: 'medium', nix_item_id: '513fceb475b8dbbc21002e24' },
  { food_name: 'Banana', brand_name: 'Generic', serving_qty: 1, serving_unit: 'medium', nix_item_id: '513fceb475b8dbbc21002e25' },
  { food_name: 'Chicken Breast', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e26' },
  { food_name: 'Rice', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e27' },
  { food_name: 'Salmon', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e28' },
  { food_name: 'Broccoli', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e29' },
  { food_name: 'Eggs', brand_name: 'Generic', serving_qty: 1, serving_unit: 'large', nix_item_id: '513fceb475b8dbbc21002e30' },
  { food_name: 'Oatmeal', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e31' },
  { food_name: 'Milk', brand_name: 'Generic', serving_qty: 240, serving_unit: 'ml', nix_item_id: '513fceb475b8dbbc21002e32' },
  { food_name: 'Bread', brand_name: 'Generic', serving_qty: 1, serving_unit: 'slice', nix_item_id: '513fceb475b8dbbc21002e33' },
  { food_name: 'Yogurt', brand_name: 'Generic', serving_qty: 170, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e34' },
  { food_name: 'Spinach', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e35' },
  { food_name: 'Sweet Potato', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e36' },
  { food_name: 'Avocado', brand_name: 'Generic', serving_qty: 1, serving_unit: 'medium', nix_item_id: '513fceb475b8dbbc21002e37' },
  { food_name: 'Almonds', brand_name: 'Generic', serving_qty: 28, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e38' },
  { food_name: 'Greek Yogurt', brand_name: 'Generic', serving_qty: 170, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e39' },
  { food_name: 'Quinoa', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e40' },
  { food_name: 'Tuna', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e41' },
  { food_name: 'Carrots', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e42' },
  { food_name: 'Blueberries', brand_name: 'Generic', serving_qty: 100, serving_unit: 'g', nix_item_id: '513fceb475b8dbbc21002e43' }
];

// Function to delete food logs older than one day
async function deleteOldFoodLogs() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD format
    
    console.log('🗑️ Deleting food logs older than:', yesterdayStr);
    
    // Delete from FoodLogModel collection
    const deletedFromCollection = await FoodLogModel.deleteMany({
      date: { $lt: yesterdayStr }
    });
    
    console.log(`🗑️ Deleted ${deletedFromCollection.deletedCount} food logs from collection`);
    
    // Also clean up from user's foodLogs array
    const users = await User.find({});
    let totalDeletedFromUsers = 0;
    
    for (const user of users) {
      const originalLength = user.foodLogs.length;
      user.foodLogs = user.foodLogs.filter(log => log.date >= yesterdayStr);
      const deletedCount = originalLength - user.foodLogs.length;
      
      if (deletedCount > 0) {
        await user.save();
        totalDeletedFromUsers += deletedCount;
      }
    }
    
    console.log(`🗑️ Deleted ${totalDeletedFromUsers} food logs from user arrays`);
    
    return {
      collectionDeleted: deletedFromCollection.deletedCount,
      userArraysDeleted: totalDeletedFromUsers
    };
  } catch (error) {
    console.error('❌ Error deleting old food logs:', error);
    throw error;
  }
}

// Scheduled cleanup function that runs every 24 hours
function startScheduledCleanup() {
  console.log('🔄 Starting scheduled food log cleanup (every 24 hours)');
  
  // Run cleanup every 24 hours (86400000 milliseconds)
  setInterval(async () => {
    try {
      console.log('🔄 Running scheduled food log cleanup...');
      await deleteOldFoodLogs();
      console.log('✅ Scheduled cleanup completed');
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  // Also run initial cleanup
  setTimeout(async () => {
    try {
      console.log('🔄 Running initial food log cleanup...');
      await deleteOldFoodLogs();
      console.log('✅ Initial cleanup completed');
    } catch (error) {
      console.error('❌ Initial cleanup failed:', error);
    }
  }, 5000); // Run after 5 seconds of server start
}

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
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    // Clean up old food logs after adding a new one
    try {
      await deleteOldFoodLogs();
    } catch (cleanupError) {
      console.warn('Failed to clean up old food logs:', cleanupError);
      // Don't fail the request if cleanup fails
    }

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
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// Manual cleanup route for old food logs
router.post('/cleanup-old-logs', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const result = await deleteOldFoodLogs();
    
    res.json({
      success: true,
      message: 'Old food logs cleaned up successfully',
      deletedCount: result
    });
  } catch (err) {
    console.error('Error during manual cleanup:', err);
    res.status(500).json({ error: 'Failed to clean up old food logs', details: err.message });
  }
});

// POST search foods using Nutritionix API
router.post('/search', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`[FOOD SEARCH] Searching for: "${query}"`);

    try {
      // Try Nutritionix API first
      const postData = JSON.stringify({
        query: query.trim(),
        detailed: true
      });

      const options = {
        hostname: 'trackapi.nutritionix.com',
        port: 443,
        path: '/v2/search/instant',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_APP_KEY,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const data = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsedData = JSON.parse(responseData);
                resolve(parsedData);
              } catch (error) {
                reject(new Error('Failed to parse response data'));
              }
            } else {
              reject(new Error(`Nutritionix API error: ${res.statusCode} ${res.statusMessage}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(postData);
        req.end();
      });
      
      // Combine common and branded foods
      const allFoods = [...(data.common || []), ...(data.branded || [])];
      
      console.log(`[FOOD SEARCH] Found ${allFoods.length} foods from Nutritionix API for query: "${query}"`);
      
      res.json({
        success: true,
        foods: allFoods,
        total: allFoods.length,
        source: 'nutritionix'
      });

    } catch (nutritionixError) {
      console.log(`[FOOD SEARCH] Nutritionix API failed: ${nutritionixError.message}, using fallback database`);
      
      // Use fallback database
      const searchTerm = query.trim().toLowerCase();
      const matchingFoods = FALLBACK_FOODS.filter(food => 
        food.food_name.toLowerCase().includes(searchTerm)
      );
      
      console.log(`[FOOD SEARCH] Found ${matchingFoods.length} foods from fallback database for query: "${query}"`);
      
      res.json({
        success: true,
        foods: matchingFoods,
        total: matchingFoods.length,
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('[FOOD SEARCH] Error:', error);
    res.status(500).json({ 
      error: 'Failed to search foods. Please try again.',
      details: error.message 
    });
  }
});

// POST get nutritional information for a specific food
router.post('/nutrition', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Food query is required' });
    }

    console.log(`[FOOD NUTRITION] Getting nutrition for: "${query}"`);

    try {
      // Try Nutritionix API first
      const postData = JSON.stringify({
        query: query.trim()
      });

      const options = {
        hostname: 'trackapi.nutritionix.com',
        port: 443,
        path: '/v2/natural/nutrients',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_APP_KEY,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const data = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsedData = JSON.parse(responseData);
                resolve(parsedData);
              } catch (error) {
                reject(new Error('Failed to parse response data'));
              }
            } else {
              reject(new Error(`Nutritionix API error: ${res.statusCode} ${res.statusMessage}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(postData);
        req.end();
      });
      
             console.log(`[FOOD NUTRITION] Retrieved nutrition data from Nutritionix API for: "${query}"`);
       
       res.json({
         success: true,
         foods: data.foods || [],
         total: data.foods ? data.foods.length : 0,
         source: 'nutritionix'
       });

    } catch (nutritionixError) {
      console.log(`[FOOD NUTRITION] Nutritionix API failed: ${nutritionixError.message}, using fallback nutrition data`);
      
             // Provide basic nutrition data for common foods
       const searchTerm = query.trim().toLowerCase();
       const fallbackNutrition = {
         foods: [{
           food_name: searchTerm,
           serving_qty: 1,
           serving_unit: 'serving',
           nix_item_id: 'fallback',
           alt_measures: [],
           photo: { thumb: null },
           tags: { item: searchTerm },
           brand_name: 'Generic',
           full_nutrients: [
             { attr_id: 203, value: 100 }, // Protein
             { attr_id: 204, value: 10 },  // Fat
             { attr_id: 205, value: 200 }, // Carbs
             { attr_id: 208, value: 1300 } // Calories
           ]
         }]
       };
      
      console.log(`[FOOD NUTRITION] Using fallback nutrition data for: "${query}"`);
      
      res.json({
        success: true,
        foods: fallbackNutrition.foods,
        total: fallbackNutrition.foods.length,
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('[FOOD NUTRITION] Error:', error);
    res.status(500).json({ 
      error: 'Failed to get nutritional information. Please try again.',
      details: error.message 
    });
  }
});

// Start the scheduled cleanup when this route module is loaded
startScheduledCleanup();

module.exports = router;
