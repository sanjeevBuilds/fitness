const express = require('express');
const app = express(); // ✅ Declare app FIRST

const mongoose = require('mongoose');
const UserModel = require('./models/User');
const foodEntryRoute = require('./routes/FoodEntry');
const userRoutes = require('./routes/UserRoute');
const notificationRoutes = require('./routes/Notifications');
require('dotenv').config();
const bcrypt = require('bcrypt');



app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Add route logging middleware
app.use((req, res, next) => {
  console.log('${new Date().toISOString()} - ${req.method} ${req.url}');
  next();
});

// Serve static files from Public folder
app.use('/Public', express.static('Public'));

const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/Health';

// Connect to MongoDB
mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB connected to:", MONGO_URL);
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Use routes
app.use('/api', userRoutes);
app.use('/api/foodentry', foodEntryRoute);
app.use('/api/notifications', notificationRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'HealthQuest API is running!' });
});

// Catch-all route for unmatched requests
app.use('*', (req, res) => {
  console.log("❌ 404 - ${req.method} ${req.originalUrl} not found");
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: {
      login: 'POST /api/login',
      health: 'GET /'
    }
  });
});

// POST create new user
app.post('/api/createUser', async (req, res) => {
  try {
    const userData = req.body;
    userData.email = userData.email.toLowerCase();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash the password before saving
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    // Create new user with all fields from request body
    const newUser = new UserModel(userData);
    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
