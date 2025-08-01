// Settings Page Management
class SettingsManager {
    constructor() {
        this.initializeSettings();
        this.setupEventListeners();
        this.setupDragFunctionality();
        this.initializeBadgesAndTitles();
    }

    initializeSettings() {
        // Load saved settings from localStorage
        this.loadSettings();
        
        // Apply current settings
        this.applySettings();
        
    }

    setupEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                this.toggleDarkMode(e.target.checked);
            });
        }

        // Friend requests toggle
        const friendRequestsToggle = document.getElementById('friend-requests');
        if (friendRequestsToggle) {
            friendRequestsToggle.addEventListener('change', (e) => {
                this.updateSetting('friendRequests', e.target.checked);
            });
        }

        // Activity updates toggle
        const activityUpdatesToggle = document.getElementById('activity-updates');
        if (activityUpdatesToggle) {
            activityUpdatesToggle.addEventListener('change', (e) => {
                this.updateSetting('activityUpdates', e.target.checked);
            });
        }

        // Save Changes button logic
        const saveChangesBtn = document.querySelector('.update-btn');
        if (saveChangesBtn) {
            saveChangesBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Get input values
                const profileName = document.getElementById('profile-name').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value.trim();

                // Get current user data from localStorage
                const userData = JSON.parse(localStorage.getItem('userData'));
                const originalEmail = userData?.email;
                if (!originalEmail) {
                    this.showToast('❌ User not found in localStorage', 'error');
                    return;
                }

                // Check if any changes were made
                const noProfileChange = userData.profileName === profileName;
                const noEmailChange = userData.email === email;
                const noPasswordChange = !password || password === '••••••••';
                if (noProfileChange && noEmailChange && noPasswordChange) {
                    this.showToast('⚠️ No changes to save!', 'error');
                    return;
                }

                // Build request body
                const updateData = {
                    email,
                    password,
                    profileName
                };

                try {
                    const response = await fetch(`http://localhost:8000/api/updateUser/${encodeURIComponent(originalEmail)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });
                    const result = await response.json();
                    if (response.ok) {
                        // Update localStorage if profileName or email changed
                        if (userData.profileName !== profileName || userData.email !== email) {
                            localStorage.setItem('userData', JSON.stringify({ ...userData, profileName, email }));
                        }
                        this.showToast('🎉 Changes saved successfully!', 'success');
                    } else {
                        this.showToast('❌ ' + (result.error || 'Failed to update profile'), 'error');
                    }
                } catch (err) {
                    this.showToast('❌ Server error. Please try again.', 'error');
                }
            });
        }

        // Add drag functionality to all toggle switches
        this.setupDragFunctionality();

        // Logout button logic
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                // Show gamified toast
                showLogoutToast();
                // Clear user data and redirect after short delay
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '../First_Page/FirstPage.html';
                }, 1200);
            });
        }

        // Avatar change logic
        const avatarFilenames = [
            'avator.jpeg', 'avator1.jpeg', 'avator2.jpeg', 'avator3.jpeg', 'avator4.jpeg',
            'avator5.jpeg', 'avator6.jpeg', 'avator7.jpeg', 'avator8.jpeg', 'avator9.jpeg'
        ];
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const avatarOptionsDiv = document.getElementById('avatar-options');
        const confirmAvatarBtn = document.getElementById('confirm-avatar-btn');
        const closeAvatarOptionsBtn = document.getElementById('close-avatar-options');
        let selectedAvatar = null;

        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', () => {
                // Toggle avatar picker
                const isVisible = avatarOptionsDiv.style.display === 'flex';
                if (isVisible) {
                    avatarOptionsDiv.style.display = 'none';
                    confirmAvatarBtn.style.display = 'none';
                    if (closeAvatarOptionsBtn) closeAvatarOptionsBtn.style.display = 'none';
                    return;
                }
                avatarOptionsDiv.innerHTML = '';
                // Add close button at the start
                if (closeAvatarOptionsBtn) {
                    avatarOptionsDiv.appendChild(closeAvatarOptionsBtn);
                    closeAvatarOptionsBtn.style.display = '';
                }
                avatarOptionsDiv.style.display = 'flex';
                confirmAvatarBtn.style.display = 'none';
                selectedAvatar = null;
                avatarFilenames.forEach(filename => {
                    const img = document.createElement('img');
                    img.src = `../../assets/${filename}`;
                    img.alt = filename;
                    img.className = 'avatar-choice';
                    img.style.width = '64px';
                    img.style.height = '64px';
                    img.style.borderRadius = '50%';
                    img.style.cursor = 'pointer';
                    img.style.border = '3px solid transparent';
                    img.style.transition = 'border 0.2s';
                    img.addEventListener('click', () => {
                        // Remove highlight from all
                        avatarOptionsDiv.querySelectorAll('img').forEach(i => i.classList.remove('selected'));
                        img.classList.add('selected');
                        selectedAvatar = filename;
                        confirmAvatarBtn.style.display = '';
                    });
                    avatarOptionsDiv.appendChild(img);
                });
            });
        }

        if (closeAvatarOptionsBtn) {
            closeAvatarOptionsBtn.addEventListener('click', () => {
                avatarOptionsDiv.style.display = 'none';
                confirmAvatarBtn.style.display = 'none';
                closeAvatarOptionsBtn.style.display = 'none';
            });
        }

        if (confirmAvatarBtn) {
            confirmAvatarBtn.addEventListener('click', async () => {
                console.log('Confirm Avatar clicked');
                if (!selectedAvatar) return;
                const userData = JSON.parse(localStorage.getItem('userData'));
                console.log(userData);
                if (!userData || !userData.email) return;
                try {
                    const response = await fetch(`http://localhost:8000/api/updateUser/${encodeURIComponent(userData.email)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ avatar: selectedAvatar })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        // Update localStorage and sidebar avatar
                        localStorage.setItem('userData', JSON.stringify({ ...userData, avatar: selectedAvatar }));
                        const sidebarAvatar = document.getElementById('sidebar-avatar');
                        if (sidebarAvatar) sidebarAvatar.src = `../../assets/${selectedAvatar}`;
                        avatarOptionsDiv.style.display = 'none';
                        confirmAvatarBtn.style.display = 'none';
                        this.showToast('Avatar updated!', 'success');
                    } else {
                        this.showToast(result.error || 'Failed to update avatar', 'error');
                    }
                } catch (err) {
                    this.showToast('Server error. Please try again.', 'error');
                }
            });
        }

        // Badges and Titles functionality
        this.setupBadgesAndTitlesListeners();
    }

    setupBadgesAndTitlesListeners() {
        // Title selection
        const confirmTitleBtn = document.getElementById('confirm-title-btn');
        if (confirmTitleBtn) {
            confirmTitleBtn.addEventListener('click', () => {
                this.confirmTitleSelection();
            });
        }

        // Badge selection
        const confirmBadgeBtn = document.getElementById('confirm-badge-btn');
        if (confirmBadgeBtn) {
            confirmBadgeBtn.addEventListener('click', () => {
                this.confirmBadgeSelection();
            });
        }
    }

    initializeBadgesAndTitles() {
        this.loadUserBadgesAndTitles();
        this.populateTitlesGrid();
        this.populateBadgesGrid();
        this.updateCurrentSelections();
        // Refresh shared sidebar display
        if (window.sharedSidebar) {
            window.sharedSidebar.refreshDisplay();
        }
    }

    loadUserBadgesAndTitles() {
        // Load user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        
        // Also try to get from currentUser if userData is empty
        if (!userData.email && !userData.profileName) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
            if (currentUser.email || currentUser.profileName) {
                // Merge currentUser data into userData
                Object.assign(userData, currentUser);
                // Save merged data back to localStorage
                localStorage.setItem('userData', JSON.stringify(userData));
            }
        }
        
        // Debug log to see what user data we have
        console.log('User data loaded:', userData);
        
        // Sample badges and titles data (in a real app, this would come from the server)
        this.availableTitles = [
            { id: 'fitness-novice', name: 'Fitness Novice', icon: '🏃‍♂️', description: 'Just starting your fitness journey', requirement: 'Complete first workout', unlocked: true },
            { id: 'meal-master', name: 'Meal Master', icon: '👨‍🍳', description: 'Expert at planning healthy meals', requirement: 'Log 50 meals', unlocked: true },
            { id: 'strength-warrior', name: 'Strength Warrior', icon: '💪', description: 'Master of strength training', requirement: 'Complete 100 strength workouts', unlocked: false },
            { id: 'cardio-king', name: 'Cardio King', icon: '🏃‍♀️', description: 'Endurance and cardio expert', requirement: 'Run 100km total', unlocked: false },
            { id: 'yoga-guru', name: 'Yoga Guru', icon: '🧘‍♀️', description: 'Flexibility and mindfulness master', requirement: 'Complete 50 yoga sessions', unlocked: false },
            { id: 'nutrition-expert', name: 'Nutrition Expert', icon: '🥗', description: 'Deep knowledge of nutrition', requirement: 'Track nutrition for 30 days', unlocked: true },
            { id: 'consistency-champion', name: 'Consistency Champion', icon: '📈', description: 'Unwavering dedication to fitness', requirement: '7-day streak', unlocked: true },
            { id: 'goal-crusher', name: 'Goal Crusher', icon: '🎯', description: 'Achieved multiple fitness goals', requirement: 'Complete 5 goals', unlocked: false },
            { id: 'fitness-legend', name: 'Fitness Legend', icon: '👑', description: 'Ultimate fitness achievement', requirement: 'Complete all challenges', unlocked: false },
            { id: 'wellness-guru', name: 'Wellness Guru', icon: '🌟', description: 'Master of holistic wellness', requirement: 'Balance fitness, nutrition, and mindfulness', unlocked: true }
        ];

        this.availableBadges = [
            { id: 'first-workout', name: 'First Workout', icon: '🎉', description: 'Completed your first workout', requirement: 'Complete 1 workout', unlocked: true },
            { id: 'week-warrior', name: 'Week Warrior', icon: '📅', description: 'Worked out for 7 consecutive days', requirement: '7-day streak', unlocked: true },
            { id: 'month-master', name: 'Month Master', icon: '📊', description: 'Consistent for an entire month', requirement: '30-day streak', unlocked: false },
            { id: 'weight-loss', name: 'Weight Loss Hero', icon: '⚖️', description: 'Achieved weight loss goal', requirement: 'Lose 5kg', unlocked: false },
            { id: 'muscle-gain', name: 'Muscle Builder', icon: '🏋️‍♂️', description: 'Gained muscle mass', requirement: 'Gain 2kg muscle', unlocked: false },
            { id: 'meal-planner', name: 'Meal Planner', icon: '📋', description: 'Created 10 meal plans', requirement: 'Plan 10 meals', unlocked: true },
            { id: 'social-fitness', name: 'Social Fitness', icon: '👥', description: 'Connected with fitness buddies', requirement: 'Add 5 friends', unlocked: true },
            { id: 'early-bird', name: 'Early Bird', icon: '🌅', description: 'Workout before 8 AM', requirement: '5 AM workouts', unlocked: false }
        ];

        // Get current selections from user data
        this.selectedTitle = userData.selectedTitle || null;
        this.selectedBadge = userData.selectedBadge || null;
    }

    populateTitlesGrid() {
        const titlesGrid = document.getElementById('titles-grid');
        if (!titlesGrid) return;

        titlesGrid.innerHTML = this.availableTitles.map(title => `
            <div class="title-item ${title.unlocked ? '' : 'locked'} ${this.selectedTitle === title.id ? 'selected' : ''}" 
                 data-title-id="${title.id}" 
                 onclick="${title.unlocked ? 'settingsManager.selectTitle(\'' + title.id + '\')' : ''}">
                <div class="title-icon">${title.icon}</div>
                <div class="title-info">
                    <div class="title-name">${title.name}</div>
                    <div class="title-description">${title.description}</div>
                    <div class="title-requirement">${title.requirement}</div>
                </div>
                ${!title.unlocked ? '<div class="locked-indicator">🔒</div>' : ''}
            </div>
        `).join('');
    }

    populateBadgesGrid() {
        const badgesGrid = document.getElementById('badges-grid');
        if (!badgesGrid) return;

        badgesGrid.innerHTML = this.availableBadges.map(badge => `
            <div class="badge-item ${badge.unlocked ? '' : 'locked'} ${this.selectedBadge === badge.id ? 'selected' : ''}" 
                 data-badge-id="${badge.id}" 
                 onclick="${badge.unlocked ? 'settingsManager.selectBadge(\'' + badge.id + '\')' : ''}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-info">
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-description">${badge.description}</div>
                    <div class="badge-requirement">${badge.requirement}</div>
                </div>
                ${!badge.unlocked ? '<div class="locked-indicator">🔒</div>' : ''}
            </div>
        `).join('');
    }

    selectTitle(titleId) {
        // Remove previous selection
        document.querySelectorAll('.title-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to clicked item
        const selectedItem = document.querySelector(`[data-title-id="${titleId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.selectedTitle = titleId;
        document.getElementById('confirm-title-btn').style.display = 'block';
    }

    selectBadge(badgeId) {
        // Remove previous selection
        document.querySelectorAll('.badge-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to clicked item
        const selectedItem = document.querySelector(`[data-badge-id="${badgeId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.selectedBadge = badgeId;
        document.getElementById('confirm-badge-btn').style.display = 'block';
    }

    async confirmTitleSelection() {
        if (!this.selectedTitle) return;

        try {
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            
            // Check if user email exists
            if (!userData.email) {
                // Fallback: just update localStorage without server call
                localStorage.setItem('userData', JSON.stringify({ ...userData, selectedTitle: this.selectedTitle }));
                this.updateCurrentSelections();
                // Refresh shared sidebar display
                if (window.sharedSidebar) {
                    window.sharedSidebar.refreshDisplay();
                }
                document.getElementById('confirm-title-btn').style.display = 'none';
                this.showToast('Title updated successfully! (offline mode)', 'success');
                return;
            }

            const updateData = { selectedTitle: this.selectedTitle };

            const response = await fetch(`http://localhost:8000/api/updateUser/${encodeURIComponent(userData.email)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                // Update localStorage
                localStorage.setItem('userData', JSON.stringify({ ...userData, selectedTitle: this.selectedTitle }));
                
                // Update display
                this.updateCurrentSelections();
                // Refresh shared sidebar display
                if (window.sharedSidebar) {
                    window.sharedSidebar.refreshDisplay();
                }
                
                // Hide confirm button
                document.getElementById('confirm-title-btn').style.display = 'none';
                
                this.showToast('Title updated successfully!', 'success');
            } else {
                const result = await response.json();
                this.showToast(result.error || 'Failed to update title', 'error');
            }
        } catch (error) {
            console.error('Error updating title:', error);
            // Fallback: update localStorage even if server call fails
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            localStorage.setItem('userData', JSON.stringify({ ...userData, selectedTitle: this.selectedTitle }));
            this.updateCurrentSelections();
            // Refresh shared sidebar display
            if (window.sharedSidebar) {
                window.sharedSidebar.refreshDisplay();
            }
            document.getElementById('confirm-title-btn').style.display = 'none';
            this.showToast('Title updated successfully! (offline mode)', 'success');
        }
    }

    async confirmBadgeSelection() {
        if (!this.selectedBadge) return;

        try {
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            
            // Check if user email exists
            if (!userData.email) {
                // Fallback: just update localStorage without server call
                localStorage.setItem('userData', JSON.stringify({ ...userData, selectedBadge: this.selectedBadge }));
                this.updateCurrentSelections();
                // Refresh shared sidebar display
                if (window.sharedSidebar) {
                    window.sharedSidebar.refreshDisplay();
                }
                document.getElementById('confirm-badge-btn').style.display = 'none';
                this.showToast('Badge updated successfully! (offline mode)', 'success');
                return;
            }

            const updateData = { selectedBadge: this.selectedBadge };

            const response = await fetch(`http://localhost:8000/api/updateUser/${encodeURIComponent(userData.email)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                // Update localStorage
                localStorage.setItem('userData', JSON.stringify({ ...userData, selectedBadge: this.selectedBadge }));
                
                // Update display
                this.updateCurrentSelections();
                // Refresh shared sidebar display
                if (window.sharedSidebar) {
                    window.sharedSidebar.refreshDisplay();
                }
                
                // Hide confirm button
                document.getElementById('confirm-badge-btn').style.display = 'none';
                
                this.showToast('Badge updated successfully!', 'success');
            } else {
                const result = await response.json();
                this.showToast(result.error || 'Failed to update badge', 'error');
            }
        } catch (error) {
            console.error('Error updating badge:', error);
            // Fallback: update localStorage even if server call fails
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            localStorage.setItem('userData', JSON.stringify({ ...userData, selectedBadge: this.selectedBadge }));
            this.updateCurrentSelections();
            // Refresh shared sidebar display
            if (window.sharedSidebar) {
                window.sharedSidebar.refreshDisplay();
            }
            document.getElementById('confirm-badge-btn').style.display = 'none';
            this.showToast('Badge updated successfully! (offline mode)', 'success');
        }
    }

    updateCurrentSelections() {
        const currentTitleDisplay = document.getElementById('current-title-display');
        const currentBadgeDisplay = document.getElementById('current-badge-display');

        if (currentTitleDisplay) {
            const selectedTitle = this.availableTitles.find(t => t.id === this.selectedTitle);
            currentTitleDisplay.textContent = selectedTitle ? selectedTitle.name : 'None';
        }

        if (currentBadgeDisplay) {
            const selectedBadge = this.availableBadges.find(b => b.id === this.selectedBadge);
            currentBadgeDisplay.textContent = selectedBadge ? selectedBadge.name : 'None';
        }
    }

    updateSidebarDisplay() {
        // Update sidebar to show selected title and badge
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        const selectedTitle = this.availableTitles.find(t => t.id === this.selectedTitle);
        const selectedBadge = this.availableBadges.find(b => b.id === this.selectedBadge);

        // Update sidebar username to include title prominently
        const sidebarUsername = document.getElementById('sidebar-username');
        if (sidebarUsername) {
            let displayText = userData.profileName || 'User';
            
            // Add title prominently if selected
            if (selectedTitle) {
                displayText = `${selectedTitle.icon} ${selectedTitle.name}`;
            }
            
            // Add badge if selected
            if (selectedBadge) {
                displayText += ` ${selectedBadge.icon}`;
            }
            
            sidebarUsername.textContent = displayText;
            
            // Add special styling for title display
            if (selectedTitle) {
                sidebarUsername.style.background = 'linear-gradient(135deg, rgba(41, 236, 139, 0.1), rgba(30, 200, 120, 0.1))';
                sidebarUsername.style.padding = '0.5rem 1rem';
                sidebarUsername.style.borderRadius = '20px';
                sidebarUsername.style.border = '2px solid rgba(41, 236, 139, 0.3)';
                sidebarUsername.style.fontWeight = '700';
                sidebarUsername.style.fontSize = '1rem';
            } else {
                sidebarUsername.style.background = 'none';
                sidebarUsername.style.padding = '0';
                sidebarUsername.style.borderRadius = '0';
                sidebarUsername.style.border = 'none';
                sidebarUsername.style.fontWeight = '600';
                sidebarUsername.style.fontSize = '1.1rem';
            }
        }
    }

    setupDragFunctionality() {
        const toggleSwitches = document.querySelectorAll('.toggle-switch');
        
        toggleSwitches.forEach(toggleSwitch => {
            const input = toggleSwitch.querySelector('input');
            const slider = toggleSwitch.querySelector('.slider');
            
            if (!input || !slider) return;

            let isDragging = false;
            let startX = 0;

            // Mouse events
            toggleSwitch.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isDragging = true;
                startX = e.clientX;
                toggleSwitch.classList.add('dragging');
            });

            // Touch events for mobile
            toggleSwitch.addEventListener('touchstart', (e) => {
                e.preventDefault();
                isDragging = true;
                startX = e.touches[0].clientX;
                toggleSwitch.classList.add('dragging');
            });

            // Global mouse/touch events
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    const currentX = e.clientX;
                    const deltaX = currentX - startX;
                    const toggleWidth = toggleSwitch.offsetWidth;
                    
                    // Determine if toggle should be on/off based on drag direction
                    const shouldBeOn = deltaX > toggleWidth / 2;
                    
                    if (input.checked !== shouldBeOn) {
                        input.checked = shouldBeOn;
                        input.dispatchEvent(new Event('change'));
                    }
                }
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    toggleSwitch.classList.remove('dragging');
                }
            });

            document.addEventListener('touchmove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    const currentX = e.touches[0].clientX;
                    const deltaX = currentX - startX;
                    const toggleWidth = toggleSwitch.offsetWidth;
                    
                    const shouldBeOn = deltaX > toggleWidth / 2;
                    
                    if (input.checked !== shouldBeOn) {
                        input.checked = shouldBeOn;
                        input.dispatchEvent(new Event('change'));
                    }
                }
            }, { passive: false });

            document.addEventListener('touchend', () => {
                if (isDragging) {
                    isDragging = false;
                    toggleSwitch.classList.remove('dragging');
                }
            });
        });
    }

    loadSettings() {
        // Load dark mode setting
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const darkModeToggle = document.getElementById('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.checked = darkMode;
        }

        // Load other settings
        const friendRequests = localStorage.getItem('friendRequests') !== 'false'; // Default to true
        const friendRequestsToggle = document.getElementById('friend-requests');
        if (friendRequestsToggle) {
            friendRequestsToggle.checked = friendRequests;
        }

        const activityUpdates = localStorage.getItem('activityUpdates') !== 'false'; // Default to true
        const activityUpdatesToggle = document.getElementById('activity-updates');
        if (activityUpdatesToggle) {
            activityUpdatesToggle.checked = activityUpdates;
        }
    }

    applySettings() {
        // Apply dark mode
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    toggleDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }

        // Dispatch event for other components to listen to
        document.dispatchEvent(new CustomEvent('darkModeChanged', {
            detail: { enabled }
        }));
    }

    updateSetting(key, value) {
        localStorage.setItem(key, value.toString());
        
        // Show feedback
        this.showToast(`${key} ${value ? 'enabled' : 'disabled'}`);
    }

    showToast(message, type = 'success') {
        // Remove any existing toast
        const oldToast = document.querySelector('.toast-notification');
        if (oldToast) oldToast.remove();
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification gamified-toast ' + (type === 'success' ? 'toast-success' : 'toast-error');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 32px;
            right: 32px;
            background: ${type === 'success' ? 'linear-gradient(90deg, #27ae60 60%, #41e396 100%)' : 'linear-gradient(90deg, #c0392b 60%, #ff7675 100%)'};
            color: white;
            padding: 18px 32px;
            border-radius: 16px;
            z-index: 2000;
            font-size: 1.1rem;
            font-weight: 600;
            box-shadow: 0 6px 24px rgba(0,0,0,0.18), 0 1.5px 6px rgba(41,236,139,0.12);
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
            transition: opacity 0.25s, transform 0.25s;
            display: flex;
            align-items: center;
            gap: 0.75em;
            letter-spacing: 0.5px;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'scale(1) translateY(0)';
        }, 50);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'scale(0.95) translateY(-20px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 250);
        }, 2500);
    }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.settingsManager = new SettingsManager();
    // Set sidebar avatar on load
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && userData.avatar) {
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        if (sidebarAvatar) sidebarAvatar.src = `../../assets/${userData.avatar}`;
    }
    
    // Update sidebar display with titles and badges
    if (window.settingsManager) {
        window.settingsManager.updateSidebarDisplay();
    }
    
    // Populate gamification UI (badges, titles, XP, coins, activity log)
    if (typeof fetchUserDataAndRenderProfile === 'function') {
        fetchUserDataAndRenderProfile();
    }
});

// Global function to apply dark mode (for other pages)
function applyGlobalDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
}

// Apply dark mode immediately for faster loading
applyGlobalDarkMode();

function showLogoutToast() {
    let toast = document.createElement('div');
    toast.className = 'gamified-toast logout-toast';
    toast.innerHTML = '<span class="toast-icon">🚪</span> Logged out! See you soon, adventurer!';
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(()=>toast.remove(), 400); }, 1100);
}

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
    try {
        const decoded = window.jwt_decode ? window.jwt_decode(token) : null;
        if (!decoded || !decoded.exp) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
    } catch (e) {
        localStorage.removeItem('authToken');
        redirectToLogin();
    }
})();
