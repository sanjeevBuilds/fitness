const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');

// GET insights for a user by email
router.get('/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();

    // Find all insights for this user
    const insights = await Insight.find({ userEmail: email }).sort({ createdAt: -1 });

    // If no insights are found
    if (!insights || insights.length === 0) {
      return res.status(404).json({ error: 'No insights found for this user' });
    }

    // Return insights
    res.json(insights);
  } catch (err) {
    console.error('Error fetching insights:', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

module.exports = router;
