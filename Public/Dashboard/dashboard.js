// Authentication and User Data Management
class UserAuth {
    constructor() {
        this.userData = null;
        this.checkAuth();
    }

    // Check if user is authenticated (now optional)
    checkAuth() {
        const storedUserData = localStorage.getItem('userData');
        if (!storedUserData) {
            // No authentication required - use default data
            this.userData = {
                profileName: 'Guest User',
                avatar: 'avatar1.png',
                email: 'guest@example.com',
                xp: 1250,
                level: 4,
                createdAt: new Date().toISOString()
            };
            this.displayUserData();
            return;
        }

        try {
            this.userData = JSON.parse(storedUserData);
            this.displayUserData();
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('userData');
            // Use default data instead of redirecting
            this.userData = {
                profileName: 'Guest User',
                avatar: 'avatar1.png',
                email: 'guest@example.com',
                xp: 1250,
                level: 4,
                createdAt: new Date().toISOString()
            };
            this.displayUserData();
        }
    }

    // Display user data in the dashboard
    displayUserData() {
        if (!this.userData) return;

        // Update sidebar user profile
        const userAvatar = document.querySelector('.user-profile .avatar');
        const userName = document.querySelector('.user-profile .user-name');
        const userLevel = document.querySelector('.user-profile .user-level');

        if (userAvatar) {
            userAvatar.src = `../../assets/${this.userData.avatar}`;
            userAvatar.alt = `${this.userData.profileName}'s Avatar`;
        }

        if (userName) {
            userName.textContent = this.userData.profileName;
        }

        if (userLevel) {
            userLevel.textContent = `Level ${this.userData.level}`;
        }

        // Update gamified header
        this.updateGamifiedHeader();

        // Update page title
        document.title = `Dashboard - ${this.userData.profileName}`;
    }

    // Update gamified header with user data
    updateGamifiedHeader() {
        const currentLevel = document.querySelector('.current-level');
        const xpDisplay = document.querySelector('.xp');
        const levelStat = document.querySelector('[data-stat="level"]');
        const xpStat = document.querySelector('[data-stat="xp"]');

        if (currentLevel) {
            currentLevel.textContent = `Level ${this.userData.level}`;
        }

        if (xpDisplay) {
            const xpForCurrentLevel = this.getXPForLevel(this.userData.level);
            const xpForNextLevel = this.getXPForLevel(this.userData.level + 1);
            const currentXP = this.userData.xp - xpForCurrentLevel;
            const xpNeeded = xpForNextLevel - xpForCurrentLevel;
            xpDisplay.textContent = `${currentXP}/${xpNeeded} XP`;
        }

        if (levelStat) {
            levelStat.textContent = this.userData.level;
        }

        if (xpStat) {
            xpStat.textContent = this.userData.xp.toLocaleString();
        }

        // Update progress bar
        this.updateProgressBar();
    }

    // Calculate XP required for a level
    getXPForLevel(level) {
        if (level <= 1) return 0;
        if (level <= 2) return 100;
        if (level <= 3) return 300;
        if (level <= 4) return 600;
        if (level <= 5) return 1000;
        if (level <= 6) return 1500;
        if (level <= 7) return 2100;
        if (level <= 8) return 2800;
        if (level <= 9) return 3600;
        return 4500 + (level - 10) * 1000;
    }

    // Update progress bar
    updateProgressBar() {
        const progressFill = document.querySelector('.progress-fill');
        if (!progressFill) return;

        const xpForCurrentLevel = this.getXPForLevel(this.userData.level);
        const xpForNextLevel = this.getXPForLevel(this.userData.level + 1);
        const currentXP = this.userData.xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const percentage = Math.min((currentXP / xpNeeded) * 100, 100);

        progressFill.style.width = `${percentage}%`;
    }

    // Logout function
    logout() {
        localStorage.removeItem('userData');
        window.location.href = '/Public/test/login.html';
    }

    // Get current user data
    getUserData() {
        return this.userData;
    }

    // Update user data (for when user updates profile)
    updateUserData(newData) {
        this.userData = { ...this.userData, ...newData };
        localStorage.setItem('userData', JSON.stringify(this.userData));
        this.displayUserData();
    }
}

// Dashboard Gamification System
class DashboardGamification {
    constructor() {
        this.userData = this.loadUserData();
        this.init();
    }

    init() {
        this.updateLevelDisplay();
        this.updateProgressBar();
        this.updateStats();
        this.setupEventListeners();
    }

    // Load user data from localStorage or use defaults
    loadUserData() {
        const savedData = localStorage.getItem('userData');
        if (savedData) {
            return JSON.parse(savedData);
        }
        
        // Default user data
        return {
            xp: 1250,
            level: 1,
            coins: 50,
            totalSteps: 0,
            totalWater: 0,
            totalSleep: 0,
            totalMeals: 0,
            totalExercise: 0,
            totalPostureScans: 0,
            activityLog: []
        };
    }

    // Save user data to localStorage
    saveUserData() {
        localStorage.setItem('userData', JSON.stringify(this.userData));
    }

    // Calculate level based on XP using the formula: XP_required = 100 * level^1.5
    calculateLevel(xp) {
        if (xp <= 0) return 1;
        
        // Reverse the formula to find level: level = (XP / 100)^(2/3)
        const level = Math.pow(xp / 100, 2/3);
        return Math.floor(level) + 1;
    }

    // Calculate XP required for next level
    calculateXPForLevel(level) {
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    // Calculate XP required for current level
    calculateXPForCurrentLevel(level) {
        return Math.floor(100 * Math.pow(level - 1, 1.5));
    }

    // Calculate progress percentage toward next level
    calculateProgressPercentage() {
        const currentLevel = this.userData.level;
        const currentLevelXP = this.calculateXPForCurrentLevel(currentLevel);
        const nextLevelXP = this.calculateXPForLevel(currentLevel);
        const userXP = this.userData.xp;
        
        const xpInCurrentLevel = userXP - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        
        return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
    }

    // Add XP and handle level ups
    addXP(amount, reason = 'Activity completed') {
        const oldLevel = this.userData.level;
        const oldXP = this.userData.xp;
        
        // Add XP
        this.userData.xp += amount;
        
        // Calculate new level
        const newLevel = this.calculateLevel(this.userData.xp);
        this.userData.level = newLevel;
        
        // Log activity
        this.logActivity(amount, reason);
        
        // Save data
        this.saveUserData();
        
        // Update UI
        this.updateLevelDisplay();
        this.updateProgressBar();
        this.updateStats();
        
        // Check for level up
        if (newLevel > oldLevel) {
            this.handleLevelUp(oldLevel, newLevel);
        }
        
        // Show XP gain animation
        this.showXPGainAnimation(amount);
    }

    // Handle level up
    handleLevelUp(oldLevel, newLevel) {
        // Add coins for level up
        const coinsEarned = 10;
        this.userData.coins += coinsEarned;
        this.saveUserData();
        
        // Show level up notification
        this.showLevelUpNotification(newLevel, coinsEarned);
        
        // Update coin display
        this.updateCoinDisplay();
        
        // Add to activity log
        this.logActivity(0, `🎉 Level Up! Reached Level ${newLevel}`, 'levelup');
    }

    // Log activity
    logActivity(xpGained, reason, type = 'xp') {
        const activity = {
            id: Date.now(),
            type: type,
            xpGained: xpGained,
            reason: reason,
            timestamp: new Date().toISOString(),
            level: this.userData.level
        };
        
        this.userData.activityLog.unshift(activity);
        
        // Keep only last 20 activities
        if (this.userData.activityLog.length > 20) {
            this.userData.activityLog = this.userData.activityLog.slice(0, 20);
        }
    }

    // Update level display
    updateLevelDisplay() {
        const levelElements = document.querySelectorAll('.user-level, .level-badge, .current-level');
        levelElements.forEach(element => {
            element.textContent = `Level ${this.userData.level}`;
        });
        
        // Update level info in progress section
        const levelInfo = document.querySelector('.level-info');
        if (levelInfo) {
            const currentLevelXP = this.calculateXPForCurrentLevel(this.userData.level);
            const nextLevelXP = this.calculateXPForLevel(this.userData.level);
            const userXP = this.userData.xp;
            
            levelInfo.innerHTML = `
                <div>
                    <span class="level-text">Level ${this.userData.level}</span>
                    <span class="xp-text">${userXP} XP</span>
                </div>
                <div class="xp-details">
                    <span class="xp-current">${userXP - currentLevelXP}</span>
                    <span class="xp-separator">/</span>
                    <span class="xp-needed">${nextLevelXP - currentLevelXP}</span>
                    <span class="xp-label">XP to next level</span>
                </div>
            `;
        }
    }

    // Update progress bar
    updateProgressBar() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const percentage = this.calculateProgressPercentage();
            progressFill.style.width = `${percentage}%`;
            
            // Add animation class for smooth transitions
            progressFill.classList.add('progress-animated');
            setTimeout(() => {
                progressFill.classList.remove('progress-animated');
            }, 500);
        }
    }

    // Update stats
    updateStats() {
        // Update XP stat
        const xpStat = document.querySelector('.stat-value[data-stat="xp"]');
        if (xpStat) {
            xpStat.textContent = this.userData.xp.toLocaleString();
        }
        
        // Update level stat
        const levelStat = document.querySelector('.stat-value[data-stat="level"]');
        if (levelStat) {
            levelStat.textContent = this.userData.level;
        }
        
        // Update coin stat
        const coinStat = document.querySelector('.stat-value[data-stat="coins"]');
        if (coinStat) {
            coinStat.textContent = this.userData.coins;
        }
    }

    // Update coin display
    updateCoinDisplay() {
        const coinBalance = document.querySelector('.coin-balance');
        if (coinBalance) {
            coinBalance.textContent = this.userData.coins;
        }
    }

    // Show XP gain animation
    showXPGainAnimation(amount) {
        const animation = document.createElement('div');
        animation.className = 'xp-gain-animation';
        animation.innerHTML = `+${amount} XP`;
        
        // Position near the progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.appendChild(animation);
            
            // Remove after animation
            setTimeout(() => {
                animation.remove();
            }, 2000);
        }
    }

    // Show level up notification
    showLevelUpNotification(newLevel, coinsEarned) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">🎉</div>
                <div class="level-up-text">
                    <h3>Level Up!</h3>
                    <p>You're now Level ${newLevel}</p>
                    <p class="coins-earned">+${coinsEarned} coins earned!</p>
                </div>
                <button class="close-notification">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add show class after a small delay
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }

    // Setup event listeners for quest completion
    setupEventListeners() {
        // Listen for quest completion events
        document.addEventListener('questCompleted', (e) => {
            const { questType, xpReward } = e.detail;
            this.addXP(xpReward, `${questType} completed`);
        });
        
        // Listen for manual XP additions (for testing)
        document.addEventListener('addXP', (e) => {
            const { amount, reason } = e.detail;
            this.addXP(amount, reason);
        });
        
        // Setup quest checkboxes
        this.setupQuestCheckboxes();
    }

    // Setup quest checkboxes with XP rewards
    setupQuestCheckboxes() {
        const questCheckboxes = document.querySelectorAll('.quest-checkbox');
        
        questCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const questItem = e.target.closest('.checklist-item');
                    const questType = questItem.dataset.quest;
                    const xpReward = this.getQuestXPReward(questType);
                    
                    // Add XP reward
                    this.addXP(xpReward, `${questType} quest completed`);
                    
                    // Disable checkbox to prevent multiple completions
                    e.target.disabled = true;
                    
                    // Add completion styling
                    questItem.classList.add('completed');
                }
            });
        });
    }

    // Get XP reward for quest type
    getQuestXPReward(questType) {
        const rewards = {
            water: 25,
            steps: 50,
            sleep: 30,
            posture: 40,
            meal: 20,
            exercise: 60
        };
        return rewards[questType] || 10;
    }

    // Get user data for external use
    getUserData() {
        return this.userData;
    }

    // Reset user data (for testing)
    resetUserData() {
        this.userData = {
            xp: 0,
            level: 1,
            coins: 0,
            totalSteps: 0,
            totalWater: 0,
            totalSleep: 0,
            totalMeals: 0,
            totalExercise: 0,
            totalPostureScans: 0,
            activityLog: []
        };
        this.saveUserData();
        this.init();
    }
}

// Initialize systems when DOM is loaded
let userAuth;
let gamificationSystem;

document.addEventListener('DOMContentLoaded', function() {
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

    // Initialize authentication first
    userAuth = new UserAuth();
    
    // Initialize gamification system with user data
    if (userAuth.getUserData()) {
        gamificationSystem = new DashboardGamification();
    }
});

// Global function to add XP from other parts of the app
function addUserXP(amount, reason) {
    if (gamificationSystem) {
        gamificationSystem.addXP(amount, reason);
    }
}

// Global function to get user data
function getUserData() {
    if (userAuth) {
        return userAuth.getUserData();
    }
    return null;
}

// Global function to update user data
function updateUserData(newData) {
    if (userAuth) {
        userAuth.updateUserData(newData);
    }
}

// Smooth scroll for sidebar anchor links (future-proof, in case sections are added)
document.querySelectorAll('.nav-menu .nav-item').forEach(link => {
    link.addEventListener('click', function(e) {
        // Only handle anchor links (not page navigations)
        if (this.getAttribute('href') && this.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const section = document.getElementById(targetId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Highlight active nav-item
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                this.classList.add('active');
            }
        }
    });
});
