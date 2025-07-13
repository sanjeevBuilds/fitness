const express = require('express');
const app = express(); // ✅ Declare app FIRST

const mongoose = require('mongoose');
const UserModel = require('./models/User');
const foodEntryRoute = require('./Routes/FoodEntry');
const userRoutes = require('./routes/UserRoute');
require('dotenv').config();

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
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from Public folder
app.use('/Public', express.static('Public'));

const PORT = process.env.PORT || 3001;
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

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'HealthQuest API is running!' });
});

// Catch-all route for unmatched requests
app.use('*', (req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.originalUrl} not found`);
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


app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);

  // Insert sample user if SAMPLE_USER env variable is true
 
});
