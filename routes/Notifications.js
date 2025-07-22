const express = require('express');
const router = express.Router();
const UserModel = require('../models/User');

// GET friend requests for a user by email
router.get('/friend-requests/:email', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() }).select('friendRequests');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.friendRequests.filter(request => request.status === 'pending'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

module.exports = router;