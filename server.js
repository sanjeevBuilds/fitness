const express = require('express');
const mongoose = require('mongoose');
const UserModel = require('./models/User');
const userRoutes = require('./routes/UserRoute');
const testRoutes = require('./routes/TestRoute');
require('dotenv').config();

const app = express();
app.use(express.json());

// Serve static files from Public folder
app.use('/Public', express.static('Public'));

const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/Health';

// Setup function to add sample user
async function setupSampleUser() {
  try {
    // Check if sample user already exists
    const existingUser = await UserModel.findOne({ email: 'demo@example.com' });
    
    if (existingUser) {
      console.log('✅ Sample user already exists');
      return;
    }

    // Create sample user
    const sampleUser = new UserModel({
      email: 'demo@example.com',
      password: 'password123',
      profileName: 'FitWarrior',
      avatar: 'avatar1.png',
      exp: 1250
    });

    await sampleUser.save();
    console.log('✅ Sample user added successfully:', {
      email: sampleUser.email,
      profileName: sampleUser.profileName,
      avatar: sampleUser.avatar,
      exp: sampleUser.exp,
      createdAt: sampleUser.createdAt
    });

  } catch (error) {
    console.error('❌ Error adding sample user:', error.message);
  }
}

// Connect to MongoDB and setup
mongoose.connect(MONGO_URL)
  .then(async () => {
    console.log("✅ MongoDB connected to:", MONGO_URL);
    
    // Add sample user after successful connection
    await setupSampleUser();
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Use routes
app.use('/api', userRoutes);
app.use('/', testRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'HealthQuest API is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
