// Shared Sidebar Management for Titles Only
class SharedSidebarManager {
    constructor() {
        this.availableTitles = [
            { id: 'meal-master', name: 'Meal Master', icon: '👨‍🍳', description: 'Expert at planning healthy meals', requirement: 'Log 50 meals', unlocked: true },
            { id: 'strength-warrior', name: 'Strength Warrior', icon: '💪', description: 'Master of strength training', requirement: 'Complete 100 strength workouts', unlocked: false },
            { id: 'cardio-king', name: 'Cardio King', icon: '🏃‍♀️', description: 'Endurance and cardio expert', requirement: 'Run 100km total', unlocked: false },
            { id: 'yoga-guru', name: 'Yoga Guru', icon: '🧘‍♀️', description: 'Flexibility and mindfulness master', requirement: 'Complete 50 yoga sessions', unlocked: false },
            { id: 'nutrition-expert', name: 'Nutrition Expert', icon: '🥗', description: '5+ day calorie streak', requirement: 'Track nutrition for 30 days', unlocked: true },
            { id: 'consistency-champion', name: 'Consistency Champion', icon: '📈', description: 'Unwavering dedication to fitness', requirement: '7-day streak', unlocked: true },
            { id: 'goal-crusher', name: 'Goal Crusher', icon: '🎯', description: 'Achieved multiple fitness goals', requirement: 'Complete 5 goals', unlocked: false },
            { id: 'fitness-legend', name: 'Fitness Legend', icon: '👑', description: 'Ultimate fitness achievement', requirement: 'Complete all challenges', unlocked: false },
            { id: 'wellness-guru', name: 'Wellness Guru', icon: '🌟', description: 'Master of holistic wellness', requirement: 'Balance fitness, nutrition, and mindfulness', unlocked: true },
            { id: 'protein-beast', name: 'Protein Beast', icon: '💪', description: '5+ day protein streak', requirement: 'Complete protein goals', unlocked: false },
            { id: 'streak-legend', name: 'Streak Legend', icon: '🔥', description: '7+ day quest streak', requirement: 'Maintain quest streak', unlocked: false }
        ];

        // Badges removed - only titles are used now

        this.init();
    }

    init() {
        this.loadUserData();
        this.setupUserProfileStructure();
        this.updateSidebarDisplay();
        this.startNotificationPolling();
    }

    loadUserData() {
        // Load user data from localStorage
        let userData = JSON.parse(localStorage.getItem('userData')) || {};
        console.log('Raw userData from localStorage:', userData);
        
        // Also try to get from currentUser if userData is empty
        if (!userData.email && !userData.profileName) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
            console.log('Raw currentUser from localStorage:', currentUser);
            if (currentUser.email || currentUser.profileName) {
                // Merge currentUser data into userData
                Object.assign(userData, currentUser);
                // Save merged data back to localStorage
                localStorage.setItem('userData', JSON.stringify(userData));
                console.log('Merged userData:', userData);
            }
        }
        
        this.userData = userData;
        this.selectedTitle = userData.selectedTitle || null;
        // Badge selection removed - only titles are used now
        
        // Debug log to see what user data we have
        console.log('User data loaded:', userData);
        console.log('Selected title:', this.selectedTitle);
        // Badge logging removed - only titles are used now
    }

    setupUserProfileStructure() {
        const sidebar = document.querySelector('.sidebar');
        console.log('Sidebar element found:', sidebar);
        if (!sidebar) {
            console.log('No sidebar element found!');
            return;
        }

        // Clear existing content
        sidebar.innerHTML = '';

        // Create user profile section
        const userProfile = document.createElement('div');
        userProfile.className = 'user-profile';
        
        // Create avatar
        const avatar = document.createElement('img');
        avatar.src = this.userData.avatar ? `../../assets/${this.userData.avatar}` : '../../assets/avator.jpeg';
        avatar.alt = 'User Avatar';
        avatar.className = 'avatar';
        avatar.id = 'sidebar-avatar';
        
        // Create user info container
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        // Create user name (actual username, not title)
        const userName = document.createElement('h3');
        userName.className = 'user-name';
        userName.id = 'sidebar-username';
        const displayName = this.userData.profileName || this.userData.fullName || 'User';
        userName.textContent = displayName;
        userName.style.display = 'block'; // Ensure it's visible
        userName.style.visibility = 'visible'; // Ensure it's visible
        console.log('Setting username to:', displayName, 'from userData:', this.userData);
        
        // Create title display (separate from username)
        const titleDisplay = document.createElement('div');
        titleDisplay.className = 'title-display';
        titleDisplay.id = 'sidebar-title-display';
        titleDisplay.style.display = 'none'; // Hidden by default, will be shown if title is selected
        
        // Create level badge
        const levelBadge = document.createElement('span');
        levelBadge.className = 'level-badge user-level';
        levelBadge.id = 'sidebar-userlevel';
        levelBadge.textContent = this.userData.level ? `Level ${this.userData.level}` : 'Level 1';
        
        // Assemble user profile
        userInfo.appendChild(userName);
        userInfo.appendChild(titleDisplay); // Title display below username
        userInfo.appendChild(levelBadge);
        userProfile.appendChild(avatar);
        userProfile.appendChild(userInfo);
        
        // Create navigation menu
        const navMenu = document.createElement('nav');
        navMenu.className = 'nav-menu';
        
        // Get current page to set active state
        const currentPage = this.getCurrentPage();
        
        // Navigation items - adjust paths based on current page location
        const currentPath = window.location.pathname;
        const isInDashboard = currentPath.includes('/Dashboard/');
        const isInFoodSuggestion = currentPath.includes('/FoodSuggestion/');
        const isInNotifications = currentPath.includes('/Notifications/');
        
        let navItems = [];
        
        if (isInDashboard) {
            navItems = [
                { href: 'dashbaord.html', icon: '🏠', text: 'Home' },
                { href: 'FoodLog.html', icon: '🍽️', text: 'Food Log' },
                { href: '../FoodSuggestion/FoodSuggestion.html', icon: '💡', text: 'Food Suggestion' },
                { href: 'Buddies.html', icon: '👥', text: 'Buddies' },
                { href: '../Notifications/Notifications.html', icon: '🔔', text: 'Notification' },
                { href: 'Settings.html', icon: '⚙️', text: 'Settings' }
            ];
        } else if (isInFoodSuggestion) {
            navItems = [
                { href: '../Dashboard/dashbaord.html', icon: '🏠', text: 'Home' },
                { href: '../Dashboard/FoodLog.html', icon: '🍽️', text: 'Food Log' },
                { href: 'FoodSuggestion.html', icon: '💡', text: 'Food Suggestion' },
                { href: '../Dashboard/Buddies.html', icon: '👥', text: 'Buddies' },
                { href: '../Notifications/Notifications.html', icon: '🔔', text: 'Notification' },
                { href: '../Dashboard/Settings.html', icon: '⚙️', text: 'Settings' }
            ];
        } else if (isInNotifications) {
            navItems = [
                { href: '../Dashboard/dashbaord.html', icon: '🏠', text: 'Home' },
                { href: '../Dashboard/FoodLog.html', icon: '🍽️', text: 'Food Log' },
                { href: '../FoodSuggestion/FoodSuggestion.html', icon: '💡', text: 'Food Suggestion' },
                { href: '../Dashboard/Buddies.html', icon: '👥', text: 'Buddies' },
                { href: 'Notifications.html', icon: '🔔', text: 'Notification' },
                { href: '../Dashboard/Settings.html', icon: '⚙️', text: 'Settings' }
            ];
        } else {
            // Fallback for any other pages
            navItems = [
                { href: '../Dashboard/dashbaord.html', icon: '🏠', text: 'Home' },
                { href: '../Dashboard/FoodLog.html', icon: '🍽️', text: 'Food Log' },
                { href: '../FoodSuggestion/FoodSuggestion.html', icon: '💡', text: 'Food Suggestion' },
                { href: '../Dashboard/Buddies.html', icon: '👥', text: 'Buddies' },
                { href: '../Notifications/Notifications.html', icon: '🔔', text: 'Notification' },
                { href: '../Dashboard/Settings.html', icon: '⚙️', text: 'Settings' }
            ];
        }
        
        navItems.forEach(item => {
            const navItem = document.createElement('a');
            navItem.href = item.href;
            navItem.className = 'nav-item';
            navItem.style.position = 'relative'; // For notification badge positioning
            
            // Check if this is the current page
            const itemPath = item.href.split('/').pop();
            if (itemPath === currentPage + '.html' || 
                (currentPage === 'dashbaord' && itemPath === 'dashbaord.html') ||
                (currentPage === 'FoodSuggestion' && itemPath === 'FoodSuggestion.html') ||
                (currentPage === 'Notifications' && itemPath === 'Notifications.html')) {
                navItem.classList.add('active');
            }
            
            const navIcon = document.createElement('span');
            navIcon.className = 'nav-icon';
            navIcon.textContent = item.icon;
            
            navItem.appendChild(navIcon);
            navItem.appendChild(document.createTextNode(' ' + item.text));
            
            // Add notification badge for notification link
            if (item.text === 'Notification') {
                const notificationBadge = document.createElement('span');
                notificationBadge.className = 'notification-badge';
                notificationBadge.id = 'sidebar-notification-badge';
                notificationBadge.style.display = 'none';
                navItem.appendChild(notificationBadge);
            }
            
            navMenu.appendChild(navItem);
        });
        
        // Add everything to sidebar
        sidebar.appendChild(userProfile);
        sidebar.appendChild(navMenu);
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '');
    }

    updateSidebarDisplay() {
        // Wait a bit for DOM elements to be created
        setTimeout(() => {
            const sidebarUsername = document.getElementById('sidebar-username') || document.querySelector('.user-name');
            const titleDisplay = document.getElementById('sidebar-title-display');
            console.log('Looking for username element:', sidebarUsername);
            console.log('Looking for title display element:', titleDisplay);
            
            if (!sidebarUsername) {
                console.log('Sidebar username element not found, retrying...');
                return;
            }

            const selectedTitle = this.availableTitles.find(t => t.id === this.selectedTitle);
            // Badge selection removed - only titles are used now

            // Always show the actual username
            const displayName = this.userData.profileName || this.userData.fullName || 'User';
            sidebarUsername.textContent = displayName;
            
            // Handle title display separately
            if (titleDisplay) {
                if (selectedTitle) {
                    let titleText = `${selectedTitle.icon} ${selectedTitle.name}`;
                    titleDisplay.textContent = titleText;
                    titleDisplay.style.display = 'block';
                } else {
                    titleDisplay.style.display = 'none';
                }
            }
            
            // Keep username styling simple and normal
            sidebarUsername.style.background = 'none';
            sidebarUsername.style.padding = '0';
            sidebarUsername.style.borderRadius = '0';
            sidebarUsername.style.border = 'none';
            sidebarUsername.style.fontWeight = '600';
            sidebarUsername.style.fontSize = '1.1rem';
            sidebarUsername.style.textAlign = 'center';
            sidebarUsername.style.margin = '0';
            sidebarUsername.style.boxShadow = 'none';

            // Update avatar if available
            const avatar = document.querySelector('.avatar');
            if (avatar && this.userData.avatar) {
                avatar.src = `../../assets/${this.userData.avatar}`;
            }

            // Update level badge if available
            const levelBadge = document.querySelector('.level-badge');
            if (levelBadge && this.userData.level) {
                levelBadge.textContent = `Level ${this.userData.level}`;
            }

            console.log('Sidebar display updated with user data:', this.userData);
        }, 100);
    }

    // Method to refresh the display (can be called from other pages)
    refreshDisplay() {
        this.loadUserData();
        this.updateSidebarDisplay();
    }

    // Start polling for notification updates
    startNotificationPolling() {
        // Update notifications every 30 seconds
        setInterval(() => {
            this.updateNotificationBadge();
        }, 30000);
        
        // Initial update
        this.updateNotificationBadge();
    }

    // Update notification badge
    async updateNotificationBadge() {
        if (!this.userData.email) return;

        try {
            const response = await fetch(`http://localhost:8000/api/notifications/unread-counts/${this.userData.email}`);
            if (!response.ok) {
                throw new Error('Failed to fetch notification counts');
            }
            
            const counts = await response.json();
            const totalUnread = counts.total;
            
            const badge = document.getElementById('sidebar-notification-badge');
            if (badge) {
                badge.textContent = totalUnread;
                badge.style.display = totalUnread > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Error updating notification badge:', error);
        }
    }

    // Public method to update notification badge (can be called from other pages)
    updateNotificationCount() {
        this.updateNotificationBadge();
    }
}

// Initialize shared sidebar only once
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded, initializing shared sidebar...');
        if (!window.sharedSidebar) {
            window.sharedSidebar = new SharedSidebarManager();
        }
    });
} else {
    // DOM is already loaded, initialize immediately
    console.log('DOM already loaded, initializing shared sidebar immediately...');
    if (!window.sharedSidebar) {
        window.sharedSidebar = new SharedSidebarManager();
    }
}

// Global function to refresh sidebar display
function refreshSidebarDisplay() {
    if (window.sharedSidebar) {
        window.sharedSidebar.refreshDisplay();
    }
}

// Global function to update notification count
function updateNotificationCount() {
    if (window.sharedSidebar) {
        window.sharedSidebar.updateNotificationCount();
    }
}

// Listen for storage changes to update sidebar when user data changes
window.addEventListener('storage', function(e) {
    if (e.key === 'userData' || e.key === 'currentUser') {
        if (window.sharedSidebar) {
            window.sharedSidebar.refreshDisplay();
        }
    }
}); 