// Shared Sidebar Management for Titles Only
class SharedSidebarManager {
    constructor() {
        this.userData = null;
        this.availableTitles = [];
        this.selectedTitle = null;
        this.isMobile = this.detectMobile();
        console.log('SharedSidebarManager initialized, Mobile:', this.isMobile);
        
        // Initialize immediately if DOM is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.init();
        }
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }

    init() {
        console.log('SharedSidebarManager init called, Mobile:', this.isMobile);
        console.log('User Agent:', navigator.userAgent);
        console.log('Screen width:', window.innerWidth);
        
        this.loadUserData();
        this.setupUserProfileStructure();
        
        // Setup mobile menu if on mobile
        if (this.isMobile) {
            console.log('Setting up mobile menu...');
            this.setupMobileMenu();
            this.setupResizeHandler();
            this.ensureMobileMenuSetup();
            
            // Check if mobile menu was created properly after a delay
            setTimeout(() => {
                const mobileToggle = document.querySelector('.mobile-menu-toggle');
                if (mobileToggle) {
                    console.log('Mobile menu toggle found after delay:', mobileToggle);
                    console.log('Mobile menu toggle display:', getComputedStyle(mobileToggle).display);
                    console.log('Mobile menu toggle visibility:', getComputedStyle(mobileToggle).visibility);
                } else {
                    console.error('Mobile menu toggle not found after delay!');
                }
            }, 1000);
        }
        
        this.startNotificationPolling();
        
        // Test mobile functionality
        this.testMobileFunctionality();
    }
    
    testMobileFunctionality() {
        if (this.isMobile) {
            console.log('Testing mobile functionality...');
            // Add a test event listener to the body to verify touch events work
            document.body.addEventListener('touchstart', (e) => {
                console.log('Touch detected on body');
            }, { passive: true });
            
            // Check if mobile menu exists, if not create it
            setTimeout(() => {
                const mobileToggle = document.querySelector('.mobile-menu-toggle');
                if (!mobileToggle) {
                    console.log('Mobile menu toggle missing, creating it...');
                    this.createMobileMenuToggle();
                }
            }, 500);
        }
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
        console.log('Setting up mobile menu...');
        
        // Create mobile menu toggle button
        this.createMobileMenuToggle();
        
        // Create mobile overlay
        this.createMobileOverlay();
        
        // Setup touch events for swipe to close
        this.setupTouchEvents();
        
        // Setup keyboard events
        this.setupKeyboardEvents();
        
        console.log('Mobile menu setup complete');
    }

    createMobileMenuToggle() {
        console.log('Creating mobile menu toggle...');
        
        // Remove existing toggle if any
        const existingToggle = document.querySelector('.mobile-menu-toggle');
        if (existingToggle) {
            console.log('Removing existing mobile menu toggle');
            existingToggle.remove();
        }

        const toggle = document.createElement('button');
        toggle.className = 'mobile-menu-toggle';
        toggle.innerHTML = '<div class="hamburger"></div>';
        toggle.setAttribute('aria-label', 'Toggle mobile menu');
        
        // Ensure it's visible on mobile
        toggle.style.display = 'flex';
        toggle.style.position = 'fixed';
        toggle.style.top = '1rem';
        toggle.style.left = '1rem';
        toggle.style.zIndex = '1003';
        toggle.style.background = 'rgb(41, 236, 139)';
        toggle.style.border = 'none';
        toggle.style.borderRadius = '50%';
        toggle.style.width = '50px';
        toggle.style.height = '50px';
        toggle.style.cursor = 'pointer';
        toggle.style.boxShadow = '0 4px 12px rgba(41, 236, 139, 0.3)';
        toggle.style.transition = 'all 0.3s ease';
        toggle.style.alignItems = 'center';
        toggle.style.justifyContent = 'center';
        
        // Add text for debugging
        toggle.textContent = '☰';
        toggle.style.fontSize = '24px';
        toggle.style.color = 'white';
        toggle.style.fontWeight = 'bold';
        
        toggle.addEventListener('click', () => {
            console.log('Mobile menu toggle clicked!');
            this.toggleMobileMenu();
        });

        document.body.appendChild(toggle);
        console.log('Mobile menu toggle created and appended to body');
        
        // Verify it's in the DOM
        const createdToggle = document.querySelector('.mobile-menu-toggle');
        if (createdToggle) {
            console.log('Mobile menu toggle found in DOM:', createdToggle);
        } else {
            console.error('Mobile menu toggle not found in DOM!');
        }
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
        const displayName = this.userData.username || this.userData.profileName || this.userData.fullName || 'User';
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
            
            // Ensure the link is clickable
            navItem.style.pointerEvents = 'auto';
            navItem.style.cursor = 'pointer';
            navItem.style.textDecoration = 'none';
            
            // Add click event listener for debugging
            navItem.addEventListener('click', (e) => {
                console.log('Navigation item clicked:', item.text, 'href:', item.href);
                // Allow default navigation
            });
            
            // Add mobile-specific touch events if on mobile
            if (this.isMobile) {
                navItem.addEventListener('touchstart', (e) => {
                    console.log('Touch start on:', item.text);
                    e.preventDefault();
                    navItem.style.transform = 'scale(0.95)';
                    navItem.style.opacity = '0.8';
                });
                
                navItem.addEventListener('touchend', (e) => {
                    console.log('Touch end on:', item.text);
                    e.preventDefault();
                    navItem.style.transform = 'scale(1)';
                    navItem.style.opacity = '1';
                    // Trigger navigation
                    window.location.href = item.href;
                });
                
                // Prevent default touch behavior that might interfere
                navItem.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                });
                
                // Fallback: ensure click works even if touch events fail
                navItem.addEventListener('click', (e) => {
                    console.log('Fallback click on mobile:', item.text);
                    if (this.isMobile) {
                        e.preventDefault();
                        window.location.href = item.href;
                    }
                });
            } else {
                // Desktop mouse events
                navItem.addEventListener('mousedown', (e) => {
                    navItem.style.transform = 'scale(0.95)';
                });
                
                navItem.addEventListener('mouseup', (e) => {
                    navItem.style.transform = 'scale(1)';
                });
            }
            
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
            const displayName = this.userData.username || this.userData.profileName || this.userData.fullName || 'User';
            sidebarUsername.textContent = displayName;
            
            // Handle title display separately
            if (titleDisplay) {
                if (selectedTitle) {
                    titleDisplay.innerHTML = `${selectedTitle.icon} ${selectedTitle.name}`;
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
            window.sharedSidebar.init(); // CRITICAL: Call init() method
        }
    });
} else {
    // DOM is already loaded, initialize immediately
    console.log('DOM already loaded, initializing shared sidebar immediately...');
    if (!window.sharedSidebar) {
        window.sharedSidebar = new SharedSidebarManager();
        window.sharedSidebar.init(); // CRITICAL: Call init() method
    }
}

// IMMEDIATE FALLBACK: Create mobile menu if on mobile
(function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isMobile) {
        console.log('IMMEDIATE FALLBACK: Creating mobile menu...');
        
        // Create a simple mobile menu button immediately
        const toggle = document.createElement('button');
        toggle.className = 'mobile-menu-toggle-fallback';
        toggle.textContent = '☰';
        toggle.style.cssText = `
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1003;
            background: rgb(41, 236, 139);
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(41, 236, 139, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            font-weight: bold;
        `;
        
        toggle.addEventListener('click', () => {
            console.log('Fallback mobile menu clicked!');
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
            }
        });
        
        document.body.appendChild(toggle);
        console.log('Fallback mobile menu created!');
    }
})();

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