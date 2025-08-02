// --- JWT Auth Check (Protected Page) ---
(function() {
    const redirectToLogin = () => {
        window.location.href = '/Public/test/login.html';
    };
    const token = localStorage.getItem('authToken');
    if (!token) {
        redirectToLogin();
        return;
    }
    // jwt-decode must be loaded via CDN in the HTML
    try {
        const decoded = window.jwt_decode ? window.jwt_decode(token) : null;
        if (!decoded || !decoded.exp) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        // exp is in seconds since epoch
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        // Token is valid, allow access
    } catch (e) {
        localStorage.removeItem('authToken');
        redirectToLogin();
    }
})();

class NotificationManager {
    constructor() {
        // Load fresh user data from localStorage
        this.userData = JSON.parse(localStorage.getItem('userData')) || {};
        this.notifications = [];
        this.friendRequests = [];
        this.activityLogs = [];
        this.unreadCounts = { friendRequests: 0, notifications: 0, total: 0 };
        
        console.log('NotificationManager initialized with user data:', this.userData);
        
        this.init();
    }

    async init() {
        await this.loadAllNotifications();
        this.setupEventListeners();
        this.startAutoRefresh();
        
        // Refresh sidebar with a small delay to ensure it's fully loaded
        setTimeout(() => {
            this.refreshSidebarDisplay();
        }, 500);
        
        // Listen for localStorage changes to refresh sidebar when title changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'userData') {
                this.refreshSidebarDisplay();
            }
        });
    }

    async loadAllNotifications() {
        if (!this.userData.email) return;

        try {
            const response = await fetch(`http://localhost:8000/api/notifications/all/${this.userData.email}`);
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            
            const data = await response.json();
            this.notifications = data.notifications || [];
            this.friendRequests = data.friendRequests || [];
            this.activityLogs = data.activityLogs || [];
            this.unreadCounts = data.unreadCounts || { friendRequests: 0, notifications: 0, total: 0 };
            
            this.renderAllSections();
            this.updateSidebarNotificationCount();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    renderAllSections() {
        this.renderFriendRequests();
        this.renderNotifications();
        this.renderActivityLogs();
        this.updateUnreadCounts();
    }

    renderFriendRequests() {
        const container = document.getElementById('friend-requests');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.friendRequests.length === 0) {
            container.innerHTML = '<div class="no-requests">No pending friend requests</div>';
            return;
        }

        this.friendRequests.forEach(req => {
            const card = document.createElement('div');
            card.className = 'friend-request-card';
            card.innerHTML = `
                <img src="../../assets/${req.avatar || 'avator1.jpeg'}" alt="${req.profileName}" class="friend-avatar">
                <div class="friend-info">
                    <div class="friend-name">${req.profileName}</div>
                    <div class="friend-email">${req.email}</div>
                </div>
                <div class="friend-actions">
                    <button class="accept-btn" data-email="${req.email}">Accept</button>
                    <button class="decline-btn" data-email="${req.email}">Decline</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderNotifications() {
        const container = document.getElementById('notification-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.notifications.length === 0) {
            container.innerHTML = '<div class="no-notifications">No unread notifications</div>';
            return;
        }

        this.notifications.forEach(notification => {
            const card = document.createElement('div');
            card.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            card.dataset.notificationId = notification._id;
            
            const icon = this.getNotificationIcon(notification.type);
            const timeAgo = this.getTimeAgo(notification.createdAt);
            
            card.innerHTML = `
                <span class="notif-icon">${icon}</span>
                <div class="notif-content">
                    <div class="notif-title">${notification.title}</div>
                    <div class="notif-message">${notification.message}</div>
                    <div class="notif-time">${timeAgo}</div>
                </div>
                <button class="mark-read-btn" data-notification-id="${notification._id}">✓</button>
            `;
            container.appendChild(card);
        });
    }

    renderActivityLogs() {
        const container = document.getElementById('activity-logs');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.activityLogs.length === 0) {
            container.innerHTML = '<div class="no-activity">No recent activity</div>';
            return;
        }

        this.activityLogs.forEach(activity => {
            const card = document.createElement('div');
            card.className = 'activity-item';
            
            // Check if it's a friend activity (has friendName property)
            if (activity.friendName) {
                const timeAgo = this.getTimeAgo(activity.timestamp || activity.date);
                card.innerHTML = `
                    <div class="friend-activity">
                        <img src="../../assets/${activity.avatar || 'avator.jpeg'}" alt="${activity.friendName}" class="friend-avatar" onerror="this.src='../../assets/avator.jpeg'">
                        <div class="activity-content">
                            <div class="activity-details">
                                <span class="friend-name">${activity.friendName}</span>
                                <span class="activity-text">${activity.action}</span>
                                <span class="activity-xp">+${activity.xp} XP</span>
                            </div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            } else {
                // Regular activity
                const icon = this.getActivityIcon(activity.type);
                const timeAgo = this.getTimeAgo(activity.date);
                
                card.innerHTML = `
                    <span class="activity-icon">${icon}</span>
                    <div class="activity-content">
                        <div class="activity-details">${activity.details}</div>
                        <div class="activity-time">${timeAgo}</div>
                        ${activity.xpGained ? `<div class="activity-xp">+${activity.xpGained} XP</div>` : ''}
                        ${activity.coinsGained ? `<div class="activity-coins">+${activity.coinsGained} 🪙</div>` : ''}
                    </div>
                `;
            }
            
            container.appendChild(card);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            'info': '<i class="fas fa-info-circle"></i>',
            'success': '<i class="fas fa-check-circle"></i>',
            'warning': '<i class="fas fa-exclamation-triangle"></i>',
            'error': '<i class="fas fa-times-circle"></i>',
            'quest': '<i class="fas fa-bullseye"></i>',
            'levelup': '<i class="fas fa-star"></i>',
            'title': '<i class="fas fa-trophy"></i>',
            'friend': '<i class="fas fa-users"></i>'
        };
        return icons[type] || '<i class="fas fa-bell"></i>';
    }

    getActivityIcon(type) {
        const icons = {
            'quest': '<i class="fas fa-bullseye"></i>',
            'levelup': '<i class="fas fa-star"></i>',
            'badge': '<i class="fas fa-medal"></i>',
            'title': '<i class="fas fa-trophy"></i>',
            'challenge': '<i class="fas fa-fire"></i>',
            'purchase': '<i class="fas fa-shopping-cart"></i>',
            'achievement': '<i class="fas fa-trophy"></i>'
        };
        return icons[type] || '<i class="fas fa-clipboard-list"></i>';
    }

    getTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return past.toLocaleDateString();
    }

    updateUnreadCounts() {
        const totalUnread = this.unreadCounts.total;
        const friendRequestsCount = this.unreadCounts.friendRequests;
        const notificationsCount = this.unreadCounts.notifications;

        // Update UI elements if they exist
        const totalBadge = document.getElementById('total-unread-badge');
        const friendRequestsBadge = document.getElementById('friend-requests-badge');
        const notificationsBadge = document.getElementById('notifications-badge');

        if (totalBadge) {
            totalBadge.textContent = totalUnread;
            totalBadge.style.display = totalUnread > 0 ? 'block' : 'none';
        }

        if (friendRequestsBadge) {
            friendRequestsBadge.textContent = friendRequestsCount;
            friendRequestsBadge.style.display = friendRequestsCount > 0 ? 'block' : 'none';
        }

        if (notificationsBadge) {
            notificationsBadge.textContent = notificationsCount;
            notificationsBadge.style.display = notificationsCount > 0 ? 'block' : 'none';
        }
    }

    updateSidebarNotificationCount() {
        // Update sidebar notification count using the global function
        if (window.updateNotificationCount) {
            window.updateNotificationCount();
        }
    }

    setupEventListeners() {
        // Friend request actions
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('accept-btn')) {
                const email = e.target.dataset.email;
                await this.respondToFriendRequest(email, 'accept');
            } else if (e.target.classList.contains('decline-btn')) {
                const email = e.target.dataset.email;
                await this.respondToFriendRequest(email, 'reject');
            } else if (e.target.classList.contains('mark-read-btn')) {
                const notificationId = e.target.dataset.notificationId;
                await this.markNotificationAsRead(notificationId);
            }
        });

        // Clear all button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllNotifications());
        }

        // Mark all as read button
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => this.markAllAsRead());
        }
    }

    async respondToFriendRequest(fromEmail, action) {
        try {
            const response = await fetch('http://localhost:8000/api/notifications/friend-requests/respond', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fromEmail, 
                    toEmail: this.userData.email, 
                    action 
                })
            });

            if (!response.ok) {
                throw new Error('Failed to respond to friend request');
            }

            // Refresh notifications
            await this.loadAllNotifications();
            
            // Show success message
            this.showMessage(`Friend request ${action}ed successfully!`, 'success');
        } catch (error) {
            console.error('Error responding to friend request:', error);
            this.showMessage('Failed to respond to friend request', 'error');
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            const response = await fetch(`http://localhost:8000/api/notifications/mark-read/${this.userData.email}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });

            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }

            // Refresh notifications
            await this.loadAllNotifications();
            
            // Refresh buddies page activities if it's open
            if (window.refreshBuddiesActivities) {
                window.refreshBuddiesActivities();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch(`http://localhost:8000/api/notifications/mark-read/${this.userData.email}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read');
            }

            // Refresh notifications
            await this.loadAllNotifications();
            
            // Refresh buddies page activities if it's open
            if (window.refreshBuddiesActivities) {
                window.refreshBuddiesActivities();
            }
            
            this.showMessage('All notifications marked as read!', 'success');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            this.showMessage('Failed to mark all notifications as read', 'error');
        }
    }

    async clearAllNotifications() {
        if (!confirm('Are you sure you want to clear all notifications?')) return;

        try {
            const response = await fetch(`http://localhost:8000/api/notifications/clear-all/${this.userData.email}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to clear notifications');
            }

            // Refresh notifications
            await this.loadAllNotifications();
            
            // Refresh buddies page activities if it's open
            if (window.refreshBuddiesActivities) {
                window.refreshBuddiesActivities();
            }
            
            this.showMessage('All notifications cleared!', 'success');
        } catch (error) {
            console.error('Error clearing notifications:', error);
            this.showMessage('Failed to clear notifications', 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Create a simple toast message
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            toast.style.backgroundColor = '#4CAF50';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#f44336';
        } else {
            toast.style.backgroundColor = '#2196F3';
        }

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    startAutoRefresh() {
        // Refresh notifications every 30 seconds
        setInterval(() => {
            this.loadAllNotifications();
        }, 30000);
        
        // Also refresh sidebar periodically to catch title changes
        setInterval(() => {
            this.refreshSidebarDisplay();
        }, 10000); // Check every 10 seconds
    }

    refreshSidebarDisplay() {
        // Refresh the sidebar to show updated user data and selected title
        if (window.sharedSidebar) {
            window.sharedSidebar.loadUserData();
            window.sharedSidebar.updateSidebarDisplay();
        }
        
        // Also try the global function
        if (window.refreshSidebarDisplay) {
            window.refreshSidebarDisplay();
        }
        
        // Force a complete sidebar refresh by reloading user data
        const currentUserData = JSON.parse(localStorage.getItem('userData')) || {};
        if (currentUserData.selectedTitle !== this.userData.selectedTitle) {
            this.userData = currentUserData;
            console.log('User data updated, refreshing sidebar...');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NotificationManager();
    
    // Force refresh sidebar after a short delay to ensure it shows the latest title
    setTimeout(() => {
        if (window.sharedSidebar) {
            window.sharedSidebar.loadUserData();
            window.sharedSidebar.updateSidebarDisplay();
        }
    }, 1000);
});
