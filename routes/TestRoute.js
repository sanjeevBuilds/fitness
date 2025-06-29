const express = require('express');
const router = express.Router();

// Test login route
router.post('/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hardcoded test credentials
    const validEmail = 'demo@example.com';
    const validPassword = 'password123';
    
    if (email === validEmail && password === validPassword) {
      // Login successful
      res.json({
        message: "Login successful",
        profileName: "FitWarrior",
        avatar: "avatar1.png",
        email: "demo@example.com"
      });
    } else {
      // Login failed
      res.status(401).json({
        error: "Invalid credentials"
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: "Server error during login"
    });
  }
});

// Test health check route
router.get('/test-health', (req, res) => {
  res.json({ 
    message: 'Test routes are working!',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Test user data route (returns mock user data)
router.get('/test-user', (req, res) => {
  res.json({
    id: 'test-user-123',
    email: 'demo@example.com',
    profileName: 'FitWarrior',
    avatar: 'avatar1.png',
    exp: 1250,
    level: 4,
    coins: 150,
    createdAt: new Date().toISOString()
  });
});

// Test XP addition route
router.post('/test-add-xp', (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    res.json({
      message: 'XP added successfully',
      amount: amount,
      reason: reason || 'Test XP addition',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test XP addition error:', error);
    res.status(500).json({ error: 'Server error during XP addition' });
  }
});

module.exports = router;
