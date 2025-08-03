const express = require('express');
const router = express.Router();
const UserModel = require('../models/User');

// GET friend activities for a user
router.get('/friends/:email', async (req, res) => {
    try {
        console.log('Fetching friend activities for:', req.params.email);
        
        const user = await UserModel.findOne({ email: req.params.email.toLowerCase() });
        if (!user) {
            console.log('User not found:', req.params.email);
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if activity updates are enabled
        if (user.activityUpdates === false) {
            console.log('Activity updates disabled for user:', req.params.email);
            return res.json({ activities: [] });
        }

        // Get user's friends
        const friends = user.friends || [];
        console.log('User friends count:', friends.length);
        
        if (friends.length === 0) {
            console.log('No friends found, returning empty array');
            return res.json({ activities: [] });
        }

        // Get friend emails
        const friendEmails = friends.map(friend => friend.email);
        console.log('Friend emails:', friendEmails);

        // Find all activities from friends (level ups, achievements, etc.)
        const friendActivities = await UserModel.aggregate([
            {
                $match: {
                    email: { $in: friendEmails }
                }
            },
            {
                $unwind: '$activityLog'
            },
            {
                $match: {
                    'activityLog.type': { $in: ['levelup', 'achievement', 'title', 'quest'] }
                }
            },
            {
                $project: {
                    friendEmail: '$email',
                    friendName: '$profileName',
                    avatar: '$avatar',
                    activity: '$activityLog'
                }
            },
            {
                $sort: { 'activity.date': -1 }
            },
            {
                $limit: 50 // Limit to last 50 activities
            }
        ]);

        console.log('Raw friend activities found:', friendActivities.length);

        // Format activities for frontend
        const formattedActivities = friendActivities.map(item => ({
            _id: item.activity._id,
            userEmail: req.params.email.toLowerCase(),
            friendEmail: item.friendEmail,
            friendName: item.friendName,
            avatar: item.avatar,
            action: item.activity.details,
            xp: item.activity.xpGained || 0,
            timestamp: item.activity.date || new Date(),
            type: item.activity.type
        }));

        console.log('Formatted activities:', formattedActivities.length);
        res.json({ activities: formattedActivities });
    } catch (error) {
        console.error('Error fetching friend activities:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch friend activities', details: error.message });
    }
});

// POST add a new friend activity
router.post('/add', async (req, res) => {
    try {
        const { userEmail, friendEmail, friendName, action, xp, avatar } = req.body;

        if (!userEmail || !friendEmail || !friendName || !action) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find the user who should receive this activity
        const user = await UserModel.findOne({ email: userEmail.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if activity updates are enabled for this user
        if (user.activityUpdates === false) {
            console.log('Activity updates disabled for user:', userEmail);
            return res.json({ message: 'Activity updates disabled' });
        }

        // Check if the friend is actually in the user's friends list
        const isFriend = user.friends && user.friends.some(friend => friend.email === friendEmail);
        if (!isFriend) {
            return res.status(400).json({ error: 'Not a friend' });
        }

        // Create new activity
        const newActivity = {
            userEmail: userEmail.toLowerCase(),
            friendEmail: friendEmail.toLowerCase(),
            friendName: friendName,
            avatar: avatar || 'avator.jpeg',
            action: action,
            xp: xp || 0,
            timestamp: new Date(),
            type: 'friend_activity'
        };

        // Add to user's activity log
        if (!user.activityLog) user.activityLog = [];
        user.activityLog.unshift(newActivity);

        // Keep only last 100 activities
        if (user.activityLog.length > 100) {
            user.activityLog = user.activityLog.slice(0, 100);
        }

        await user.save();

        res.json(newActivity);
    } catch (error) {
        console.error('Error adding friend activity:', error);
        res.status(500).json({ error: 'Failed to add friend activity' });
    }
});

// DELETE clear all friend activities for a user
router.delete('/clear/:email', async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.params.email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Clear all friend activities
        if (user.activityLog) {
            user.activityLog = user.activityLog.filter(activity => 
                activity.type !== 'friend_activity'
            );
        }

        await user.save();
        res.json({ message: 'Friend activities cleared successfully' });
    } catch (error) {
        console.error('Error clearing friend activities:', error);
        res.status(500).json({ error: 'Failed to clear friend activities' });
    }
});

// POST share level up activity to friends
router.post('/share-levelup', async (req, res) => {
    try {
        const { userEmail, newLevel, xpGained } = req.body;

        if (!userEmail || !newLevel) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find the user who leveled up
        const user = await UserModel.findOne({ email: userEmail.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's friends
        const friends = user.friends || [];
        if (friends.length === 0) {
            return res.json({ message: 'No friends to share with' });
        }

        // Share level up activity with all friends (only if they have activity updates enabled)
        const sharePromises = friends.map(async (friend) => {
            const friendUser = await UserModel.findOne({ email: friend.email.toLowerCase() });
            if (friendUser && friendUser.activityUpdates !== false) {
                const levelUpActivity = {
                    userEmail: friend.email.toLowerCase(),
                    friendEmail: userEmail.toLowerCase(),
                    friendName: user.profileName,
                    avatar: user.avatar || 'avator.jpeg',
                    action: `reached Level ${newLevel}`,
                    xp: xpGained || 0,
                    timestamp: new Date(),
                    type: 'friend_activity'
                };

                if (!friendUser.activityLog) friendUser.activityLog = [];
                friendUser.activityLog.unshift(levelUpActivity);

                // Keep only last 100 activities
                if (friendUser.activityLog.length > 100) {
                    friendUser.activityLog = friendUser.activityLog.slice(0, 100);
                }

                await friendUser.save();
            }
        });

        await Promise.all(sharePromises);

        res.json({ 
            message: `Level up shared with ${friends.length} friends`,
            friendsCount: friends.length
        });
    } catch (error) {
        console.error('Error sharing level up:', error);
        res.status(500).json({ error: 'Failed to share level up' });
    }
});

// POST share achievement activity to friends
router.post('/share-achievement', async (req, res) => {
    try {
        const { userEmail, achievement, xpGained } = req.body;

        if (!userEmail || !achievement) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find the user who achieved something
        const user = await UserModel.findOne({ email: userEmail.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's friends
        const friends = user.friends || [];
        if (friends.length === 0) {
            return res.json({ message: 'No friends to share with' });
        }

        // Share achievement activity with all friends (only if they have activity updates enabled)
        const sharePromises = friends.map(async (friend) => {
            const friendUser = await UserModel.findOne({ email: friend.email.toLowerCase() });
            if (friendUser && friendUser.activityUpdates !== false) {
                const achievementActivity = {
                    userEmail: friend.email.toLowerCase(),
                    friendEmail: userEmail.toLowerCase(),
                    friendName: user.profileName,
                    avatar: user.avatar || 'avator.jpeg',
                    action: achievement,
                    xp: xpGained || 0,
                    timestamp: new Date(),
                    type: 'friend_activity'
                };

                if (!friendUser.activityLog) friendUser.activityLog = [];
                friendUser.activityLog.unshift(achievementActivity);

                // Keep only last 100 activities
                if (friendUser.activityLog.length > 100) {
                    friendUser.activityLog = friendUser.activityLog.slice(0, 100);
                }

                await friendUser.save();
            }
        });

        await Promise.all(sharePromises);

        res.json({ 
            message: `Achievement shared with ${friends.length} friends`,
            friendsCount: friends.length
        });
    } catch (error) {
        console.error('Error sharing achievement:', error);
        res.status(500).json({ error: 'Failed to share achievement' });
    }
});

module.exports = router; 