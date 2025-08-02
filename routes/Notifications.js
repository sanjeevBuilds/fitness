const express = require('express');
const router = express.Router();
const UserModel = require('../models/User');

// GET all notifications (friend requests + activity logs) for a user
router.get('/all/:email', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() })
      .select('friendRequests notifications activityLog');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get pending friend requests
    const pendingRequests = user.friendRequests.filter(request => request.status === 'pending');
    
    // Get unread notifications
    const unreadNotifications = user.notifications.filter(notification => !notification.read);
    
    // Get recent activity logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivityLogs = user.activityLog.filter(activity => 
      new Date(activity.date) >= thirtyDaysAgo
    );

    // Calculate unread counts
    const unreadCounts = {
      friendRequests: pendingRequests.length,
      notifications: unreadNotifications.length,
      total: pendingRequests.length + unreadNotifications.length
    };

    res.json({
      friendRequests: pendingRequests,
      notifications: unreadNotifications,
      activityLogs: recentActivityLogs,
      unreadCounts
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

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

// PATCH respond to friend request (accept/reject)
router.patch('/friend-requests/respond', async (req, res) => {
  try {
    const { fromEmail, toEmail, action } = req.body;
    
    if (!fromEmail || !toEmail || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await UserModel.findOne({ email: toEmail.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the friend request
    const friendRequest = user.friendRequests.find(req => req.email === fromEmail);
    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (action === 'accept') {
      friendRequest.status = 'accepted';
      
      // Add to friends list
      const fromUser = await UserModel.findOne({ email: fromEmail.toLowerCase() });
      if (fromUser) {
        // Add current user to fromUser's friends list
        if (!fromUser.friends) fromUser.friends = [];
        fromUser.friends.push({
          email: user.email,
          profileName: user.profileName,
          avatar: user.avatar,
          level: user.level
        });
        await fromUser.save();

        // Add fromUser to current user's friends list
        if (!user.friends) user.friends = [];
        user.friends.push({
          email: fromUser.email,
          profileName: fromUser.profileName,
          avatar: fromUser.avatar,
          level: fromUser.level
        });
      }
    } else if (action === 'reject') {
      friendRequest.status = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "accept" or "reject"' });
    }

    await user.save();
    res.json({ success: true, message: `Friend request ${action}ed successfully` });
  } catch (err) {
    console.error('Error responding to friend request:', err);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// PATCH mark notification as read
router.patch('/mark-read/:email', async (req, res) => {
  try {
    const { notificationId } = req.body;
    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (notificationId) {
      // Mark specific notification as read
      const notification = user.notifications.find(n => n._id.toString() === notificationId);
      if (notification) {
        notification.read = true;
      }
    } else {
      // Mark all notifications as read
      user.notifications.forEach(notification => {
        notification.read = true;
      });
    }

    // Clear all activity logs when marking notifications as read
    if (user.activityLog && user.activityLog.length > 0) {
      console.log(`Clearing ${user.activityLog.length} activity logs for user ${req.params.email}`);
      user.activityLog = [];
    }

    await user.save();
    res.json({ success: true, message: 'Notification(s) marked as read and activity logs cleared' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// GET unread notification counts for sidebar
router.get('/unread-counts/:email', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() })
      .select('friendRequests notifications');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pendingRequests = user.friendRequests.filter(request => request.status === 'pending');
    const unreadNotifications = user.notifications.filter(notification => !notification.read);

    res.json({
      friendRequests: pendingRequests.length,
      notifications: unreadNotifications.length,
      total: pendingRequests.length + unreadNotifications.length
    });
  } catch (err) {
    console.error('Error fetching unread counts:', err);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
});

// POST create new notification
router.post('/create', async (req, res) => {
  try {
    const { toEmail, type, title, message, fromUser } = req.body;
    
    const user = await UserModel.findOne({ email: toEmail.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.notifications) user.notifications = [];
    
    user.notifications.push({
      type: type || 'info',
      title,
      message,
      read: false,
      createdAt: new Date(),
      fromUser: fromUser || null
    });

    await user.save();
    res.json({ success: true, message: 'Notification created successfully' });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// DELETE clear all notifications
router.delete('/clear-all/:email', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear all notifications
    user.notifications = [];
    
    // Clear all activity logs
    if (user.activityLog && user.activityLog.length > 0) {
      console.log(`Clearing ${user.activityLog.length} activity logs for user ${req.params.email}`);
      user.activityLog = [];
    }
    
    await user.save();
    
    res.json({ success: true, message: 'All notifications and activity logs cleared' });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

module.exports = router;