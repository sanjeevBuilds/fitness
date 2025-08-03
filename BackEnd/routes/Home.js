const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Add a food log entry to the user's foodLogs array
router.post('/add', async (req, res) => {
  try {
    // You should use authentication in production!
    // For now, get userId from req.body (or req.session/user if you have auth)
    const { userId, foodLog } = req.body;
    if (!userId || !foodLog) return res.status(400).json({ error: 'Missing userId or foodLog' });

    // Push the new foodLog entry to the user's foodLogs array
    await User.findByIdAndUpdate(
      userId,
      { $push: { foodLogs: foodLog } },
      { new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving food log:', err);
    res.status(500).json({ error: 'Failed to save food log' });
  }
});

module.exports = router;
