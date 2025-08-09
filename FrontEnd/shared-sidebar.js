// Shared Sidebar Management for Titles Only
class SharedSidebarManager {
    constructor() {
        this.availableTitles = [
            { id: 'meal-master', name: 'Meal Master', icon: '<i class="fas fa-utensils"></i>', description: 'Expert at planning healthy meals', requirement: 'Log 50 meals', unlocked: true },
            { id: 'strength-warrior', name: 'Strength Warrior', icon: '<i class="fas fa-dumbbell"></i>', description: 'Master of strength training', requirement: 'Complete 100 strength workouts', unlocked: false },
            { id: 'cardio-king', name: 'Cardio King', icon: '<i class="fas fa-running"></i>', description: 'Endurance and cardio expert', requirement: 'Run 100km total', unlocked: false },
            { id: 'yoga-guru', name: 'Yoga Guru', icon: '<i class="fas fa-pray"></i>', description: 'Flexibility and mindfulness master', requirement: 'Complete 50 yoga sessions', unlocked: false },
            { id: 'nutrition-expert', name: 'Nutrition Expert', icon: '<i class="fas fa-apple-alt"></i>', description: '5+ day calorie streak', requirement: 'Track nutrition for 30 days', unlocked: true },
            { id: 'consistency-champion', name: 'Consistency Champion', icon: '<i class="fas fa-chart-line"></i>', description: 'Unwavering dedication to fitness', requirement: '7-day streak', unlocked: true },
            { id: 'goal-crusher', name: 'Goal Crusher', icon: '<i class="fas fa-bullseye"></i>', description: 'Achieved multiple fitness goals', requirement: 'Complete 5 goals', unlocked: false },
            { id: 'fitness-legend', name: 'Fitness Legend', icon: '<i class="fas fa-crown"></i>', description: 'Ultimate fitness achievement', requirement: 'Complete all challenges', unlocked: false },
            { id: 'wellness-guru', name: 'Wellness Guru', icon: '<i class="fas fa-star"></i>', description: 'Master of holistic wellness', requirement: 'Balance fitness, nutrition, and mindfulness', unlocked: true },
            { id: 'protein-beast', name: 'Protein Beast', icon: '<i class="fas fa-dumbbell"></i>', description: '5+ day protein streak', requirement: 'Complete protein goals', unlocked: false },
            { id: 'streak-legend', name: 'Streak Legend', icon: '<i class="fas fa-fire"></i>', description: '7+ day quest streak', requirement: 'Maintain quest streak', unlocked: false }
        ];

        // Badges removed - only titles are used now

        // Mobile menu state
        this.isMobileMenuOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.init();
    }

    init() {
        this.loadUserData();
        this.setupUserProfileStructure();
        this.updateSidebarDisplay();
        this.startNotificationPolling();
        
        // Add a small delay to ensure DOM is fully loaded
        setTimeout(() => {
            this.setupMobileMenu();
            this.setupResizeHandler();
            this.ensureMobileMenuSetup();
        }, 100);
    }

    setupResizeHandler() {
        // Handle window resize and orientation changes
        window.addEventListener('resize', () => {
            // Close mobile menu on large screens
            if (window.innerWidth > 768 && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
            
            // Ensure proper mobile menu setup on small screens
            if (window.innerWidth <= 768) {
                this.ensureMobileMenuSetup();
            }
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.innerWidth <= 768) {
                    this.ensureMobileMenuSetup();
                }
            }, 100);
        });
    }

    ensureMobileMenuSetup() {
        const sidebar = document.querySelector('.sidebar');
        const navMenu = sidebar?.querySelector('.nav-menu');
        
        if (sidebar && navMenu) {
            // Ensure proper mobile styling
            sidebar.style.height = '100vh';
            sidebar.style.maxHeight = '100vh';
            sidebar.style.overflowY = 'auto';
            sidebar.style.overflowX = 'hidden';
            sidebar.style.webkitOverflowScrolling = 'touch';
            
            navMenu.style.maxHeight = 'calc(100vh - 200px)';
            navMenu.style.overflowY = 'auto';
            navMenu.style.overflowX = 'hidden';
            navMenu.style.webkitOverflowScrolling = 'touch';
        }
    }

    setupMobileMenu() {
        // Create mobile menu toggle button
        this.createMobileMenuToggle();
        
        // Create mobile overlay
        this.createMobileOverlay();
        
        // Setup touch events for swipe to close
        this.setupTouchEvents();
        
        // Setup keyboard events (ESC to close)
        this.setupKeyboardEvents();
    }

    createMobileMenuToggle() {
        // Remove existing toggle if any
        const existingToggle = document.querySelector('.mobile-menu-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        const toggle = document.createElement('button');
        toggle.className = 'mobile-menu-toggle';
        toggle.innerHTML = '<div class="hamburger"></div>';
        toggle.setAttribute('aria-label', 'Toggle mobile menu');
        
        toggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        document.body.appendChild(toggle);
    }

    createMobileOverlay() {
        // Remove existing overlay if any
        const existingOverlay = document.querySelector('.mobile-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        
        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });

        document.body.appendChild(overlay);
    }

    setupTouchEvents() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Touch start
        sidebar.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        // Touch move
        sidebar.addEventListener('touchmove', (e) => {
            if (!this.isMobileMenuOpen) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = this.touchStartX - touchX;
            const deltaY = Math.abs(this.touchStartY - touchY);

            // Only handle horizontal swipes
            if (Math.abs(deltaX) > deltaY && deltaX > 50) {
                this.closeMobileMenu();
            }
        }, { passive: true });

        // Touch end
        sidebar.addEventListener('touchend', (e) => {
            this.touchStartX = 0;
            this.touchStartY = 0;
        }, { passive: true });
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        const toggle = document.querySelector('.mobile-menu-toggle');

        if (sidebar) {
            sidebar.classList.add('mobile-open');
            // Ensure sidebar is properly positioned and sized
            sidebar.style.height = '100vh';
            sidebar.style.maxHeight = '100vh';
            sidebar.style.overflowY = 'auto';
            sidebar.style.overflowX = 'hidden';
            sidebar.style.webkitOverflowScrolling = 'touch';
        }
        if (overlay) {
            overlay.classList.add('active');
        }
        if (toggle) {
            toggle.classList.add('active');
        }

        this.isMobileMenuOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Ensure nav-menu is properly scrollable
        const navMenu = sidebar?.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.style.maxHeight = 'calc(100vh - 200px)';
            navMenu.style.overflowY = 'auto';
            navMenu.style.overflowX = 'hidden';
            navMenu.style.webkitOverflowScrolling = 'touch';
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        const toggle = document.querySelector('.mobile-menu-toggle');

        if (sidebar) {
            sidebar.classList.remove('mobile-open');
            // Reset sidebar styles
            sidebar.style.height = '';
            sidebar.style.maxHeight = '';
            sidebar.style.overflowY = '';
            sidebar.style.overflowX = '';
            sidebar.style.webkitOverflowScrolling = '';
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
        if (toggle) {
            toggle.classList.remove('active');
        }

        this.isMobileMenuOpen = false;
        document.body.style.overflow = ''; // Restore scrolling
        
        // Reset nav-menu styles
        const navMenu = sidebar?.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.style.maxHeight = '';
            navMenu.style.overflowY = '';
            navMenu.style.overflowX = '';
            navMenu.style.webkitOverflowScrolling = '';
        }
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

        // Create user profile section - EXACT ORIGINAL STRUCTURE
        const userProfile = document.createElement('div');
        userProfile.className = 'user-profile';
        
        // Create avatar
        const avatar = document.createElement('img');
        avatar.src = this.userData.avatar ? this.getAssetPath(this.userData.avatar) : this.getAssetPath('avator.jpeg');
        avatar.alt = 'User Avatar';
        avatar.className = 'avatar';
        avatar.id = 'sidebar-avatar';
        
        // Create user name (actual username, not title) - NO WRAPPER DIV
        const userName = document.createElement('h3');
        userName.className = 'user-name';
        userName.id = 'sidebar-username';
        const displayName = this.userData.username || this.userData.profileName || this.userData.fullName || 'User';
        userName.textContent = displayName;
        console.log('Setting username to:', displayName, 'from userData:', this.userData);
        
        // Create level badge - NO WRAPPER DIV
        const levelBadge = document.createElement('span');
        levelBadge.className = 'level-badge user-level';
        levelBadge.id = 'sidebar-userlevel';
        levelBadge.textContent = this.userData.level ? `Level ${this.userData.level}` : 'Level 1';
        
        // Assemble user profile - ORIGINAL STRUCTURE: avatar, h3, span (NO EXTRA DIVS)
        userProfile.appendChild(avatar);
        userProfile.appendChild(userName);
        userProfile.appendChild(levelBadge);
        
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
                { href: 'dashbaord.html', icon: '<i class="fas fa-home"></i>', text: 'Home' },
                { href: 'FoodLog.html', icon: '<i class="fas fa-utensils"></i>', text: 'Food Log' },
                { href: '../FoodSuggestion/FoodSuggestion.html', icon: '<i class="fas fa-lightbulb"></i>', text: 'Food Suggestion' },
                { href: 'Buddies.html', icon: '<i class="fas fa-users"></i>', text: 'Buddies' },
                { href: '../Notifications/Notifications.html', icon: '<i class="fas fa-bell"></i>', text: 'Notification' },
                { href: 'Settings.html', icon: '<i class="fas fa-cog"></i>', text: 'Settings' }
            ];
        } else if (isInFoodSuggestion) {
            navItems = [
                { href: '../Dashboard/dashbaord.html', icon: '<i class="fas fa-home"></i>', text: 'Home' },
                { href: '../Dashboard/FoodLog.html', icon: '<i class="fas fa-utensils"></i>', text: 'Food Log' },
                { href: 'FoodSuggestion.html', icon: '<i class="fas fa-lightbulb"></i>', text: 'Food Suggestion' },
                { href: '../Dashboard/Buddies.html', icon: '<i class="fas fa-users"></i>', text: 'Buddies' },
                { href: '../Notifications/Notifications.html', icon: '<i class="fas fa-bell"></i>', text: 'Notification' },
                { href: '../Dashboard/Settings.html', icon: '<i class="fas fa-cog"></i>', text: 'Settings' }
            ];
        } else if (isInNotifications) {
            navItems = [
                { href: '../Dashboard/dashbaord.html', icon: '<i class="fas fa-home"></i>', text: 'Home' },
                { href: '../Dashboard/FoodLog.html', icon: '<i class="fas fa-utensils"></i>', text: 'Food Log' },
                { href: '../FoodSuggestion/FoodSuggestion.html', icon: '<i class="fas fa-lightbulb"></i>', text: 'Food Suggestion' },
                { href: '../Dashboard/Buddies.html', icon: '<i class="fas fa-users"></i>', text: 'Buddies' },
                { href: 'Notifications.html', icon: '<i class="fas fa-bell"></i>', text: 'Notification' },
                { href: '../Dashboard/Settings.html', icon: '<i class="fas fa-cog"></i>', text: 'Settings' }
            ];
        } else {
            // Fallback for any other pages
            navItems = [
                { href: '../Dashboard/dashbaord.html', icon: '<i class="fas fa-home"></i>', text: 'Home' },
                { href: '../Dashboard/FoodLog.html', icon: '<i class="fas fa-utensils"></i>', text: 'Food Log' },
                { href: '../FoodSuggestion/FoodSuggestion.html', icon: '<i class="fas fa-lightbulb"></i>', text: 'Food Suggestion' },
                { href: '../Dashboard/Buddies.html', icon: '<i class="fas fa-users"></i>', text: 'Buddies' },
                { href: '../Notifications/Notifications.html', icon: '<i class="fas fa-bell"></i>', text: 'Notification' },
                { href: '../Dashboard/Settings.html', icon: '<i class="fas fa-cog"></i>', text: 'Settings' }
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
            navIcon.innerHTML = item.icon;
            
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

    // Helper method to get correct asset path based on current page location
    getAssetPath(assetName) {
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/').filter(part => part !== '' && part !== 'index.html');
        
        // Calculate how many levels deep we are from the FrontEnd root
        let depth = 0;
        for (let i = pathParts.length - 1; i >= 0; i--) {
            if (pathParts[i] !== pathParts[pathParts.length - 1]) {
                depth++;
            }
        }
        
        // If we're in a subfolder, we need to go up one level
        if (pathParts.length > 1 || (pathParts.length === 1 && !currentPath.endsWith('index.html'))) {
            depth = 1;
        }
        
        const relativePath = '../'.repeat(depth);
        return `${relativePath}assets/${assetName}`;
    }

    updateSidebarDisplay() {
        // Wait a bit for DOM elements to be created
        setTimeout(() => {
            const sidebarUsername = document.getElementById('sidebar-username') || document.querySelector('.user-name');
            console.log('Looking for username element:', sidebarUsername);
            
            if (!sidebarUsername) {
                console.log('Sidebar username element not found, retrying...');
                return;
            }

            // Always show the actual username
            const displayName = this.userData.username || this.userData.profileName || this.userData.fullName || 'User';
            sidebarUsername.textContent = displayName;

            // Update avatar if available
            const avatar = document.querySelector('.avatar');
            if (avatar && this.userData.avatar) {
                avatar.src = this.getAssetPath(this.userData.avatar);
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
            const response = await fetch(getApiUrl(`/api/notifications/unread-counts/${this.userData.email}`));
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