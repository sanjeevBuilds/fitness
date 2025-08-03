// Enhanced Dashboard Gamification Class - Fixed Version
console.log('=== DASHBOARD.JS LOADED ===');

// --- JWT Auth Check (Protected Page) ---
(async function() {
    const redirectToLogin = () => {
        window.location.href = '/Login/login.html';
    };
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        redirectToLogin();
        return;
    }
    
    // Validate token with server
    try {
                    const response = await fetch(getApiUrl('/api/validateToken'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
    } catch (error) {
        console.error('Auth validation failed:', error);
        localStorage.removeItem('authToken');
        redirectToLogin();
        return;
    }
})();

// Global variable to access dashboard instance
let dashboardInstance = null;

class EnhancedDashboardGamification {
    constructor() {
        console.log('[DASHBOARD] Constructor called - initializing dashboard...');
        try {
            this.currentUser = null;
            this.smartQuests = {};
            // Badges removed - only titles are used now
            this.availableTitles = [];
            this.activityLog = [];

            // API Base URL
            this.API_BASE = getApiUrl('');

            // DOM Elements
            this.activityList = document.getElementById('activity-list');
            this.smartQuestsSection = document.querySelector('.smart-quests-section');
            this.todayDate = new Date().toISOString().slice(0, 10);
            this.questCompletionStatus = {};

            console.log('[DASHBOARD] Constructor completed successfully');
            
            // Store instance globally for debugging
            dashboardInstance = this;
            
            this.init();
        } catch (error) {
            console.error('[DASHBOARD] Constructor error:', error);
        }
    }

    async init() {
        console.log('[DASHBOARD] Init function called...');
        try {
            // First, check if the Smart Daily Quests section exists in the DOM
            this.checkSmartQuestsSectionExists();
            
            console.log('[DASHBOARD] Loading user data...');
            await this.loadUserData();
            console.log('[DASHBOARD] User data loaded successfully');
            
            console.log('[DASHBOARD] Initializing quests...');
            this.initializeQuests();
            console.log('[DASHBOARD] Quests initialized successfully');
            
            console.log('[DASHBOARD] Setting up event listeners...');
            this.setupEventListeners();
            console.log('[DASHBOARD] Event listeners set up successfully');
            
            console.log('[DASHBOARD] Loading quest states...');
            this.loadQuestStates();
            console.log('[DASHBOARD] Quest states loaded successfully');
            
            console.log('[DASHBOARD] Starting data sync...');
            this.startDataSync();
            console.log('[DASHBOARD] Data sync started successfully');
            
            // Ensure Smart Daily Quests section is visible and properly initialized
            console.log('[DASHBOARD] Ensuring Smart Daily Quests section is visible...');
            this.ensureSmartQuestsSectionVisible();
            this.updateSmartQuestUI();
            
            // Force a second check after a delay to ensure it's visible
            setTimeout(() => {
                console.log('[DASHBOARD] Second check for Smart Daily Quests visibility...');
                this.ensureSmartQuestsSectionVisible();
                this.updateSmartQuestUI();
                
                // Log the current state
                const smartQuestsSection = document.querySelector('.smart-quests-section');
                if (smartQuestsSection) {
                    console.log('[DASHBOARD] Smart quests section found:', {
                        display: smartQuestsSection.style.display,
                        visibility: smartQuestsSection.style.visibility,
                        opacity: smartQuestsSection.style.opacity,
                        offsetHeight: smartQuestsSection.offsetHeight
                    });
                } else {
                    console.error('[DASHBOARD] Smart quests section still not found!');
                }
            }, 500);
            
            console.log('[DASHBOARD] Initialization completed successfully!');
        } catch (error) {
            console.error('[DASHBOARD] Failed to initialize dashboard:', error);
            console.error('[DASHBOARD] Error stack:', error.stack);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }


    async loadUserData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No auth token');

            const decoded = window.jwt_decode(token);
            const email = decoded.email;
            
            // Clear any cached quest data to ensure fresh data for new users
            this.clearCachedQuestData();
            
            // Clear any localStorage mini challenge data to ensure we only use backend data
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData.miniChallenges) {
                console.log('Clearing localStorage miniChallenges to use backend data');
                delete userData.miniChallenges;
                localStorage.setItem('userData', JSON.stringify(userData));
            }

            const response = await fetch(`${getApiUrl('/api/getUser')}/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.currentUser = await response.json();
            
            // Debug: Log the raw backend response
            console.log('Raw backend response for user data:', this.currentUser);
            console.log('Backend miniChallenges:', this.currentUser.miniChallenges);
            console.log('Backend miniChallenges type:', typeof this.currentUser.miniChallenges);

            // Initialize defaults if missing
            this.currentUser.exp = this.currentUser.exp || 0;
            this.currentUser.coins = this.currentUser.coins || 0;
            // Always calculate level from XP to ensure it's correct
            this.currentUser.level = this.calculateLevel(this.currentUser.exp);
            
            // Log the loaded data for debugging
            console.log('[LOAD USER DATA] Loaded from backend:', {
                exp: this.currentUser.exp,
                level: this.currentUser.level,
                coins: this.currentUser.coins
            });
            
            // Verify that XP and level are consistent
            const calculatedLevel = this.calculateLevel(this.currentUser.exp);
            if (this.currentUser.level !== calculatedLevel) {
                console.warn('[LOAD USER DATA] Level mismatch detected! Backend level:', this.currentUser.level, 'Calculated level:', calculatedLevel);
                this.currentUser.level = calculatedLevel;
                console.log('[LOAD USER DATA] Corrected level to:', this.currentUser.level);
            }
            this.currentUser.titles = this.currentUser.titles || [];
            this.currentUser.selectedTitle = this.currentUser.selectedTitle || null;
            this.currentUser.activityLog = this.currentUser.activityLog || [];
            // dailyQuests removed - using questStats for tracking instead
            this.currentUser.miniChallenges = this.currentUser.miniChallenges || [];
            this.currentUser.questStats = this.currentUser.questStats || {
                totalQuestsCompleted: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastQuestDate: null,
                stepGoalHistory: []
            };

            // Load smart quest data from backend
            await this.loadSmartQuestData(email, token);

            // Load daily quest status from backend
            await this.loadDailyQuestStatus(email, token);

            // dailyQuests removed - using questStats for tracking instead

            // Badge sync removed - only titles are used now
            
            // Log the final user data to verify miniChallenges are loaded from backend
            console.log('[LOAD USER DATA] Final user data loaded from backend:', {
                miniChallenges: this.currentUser.miniChallenges,
                titles: this.currentUser.titles
            });

            console.log('User data loaded:', this.currentUser);
            console.log('Calculated level from XP:', this.currentUser.level);
            console.log('User stats - Level:', this.currentUser.level, 'XP:', this.currentUser.exp, 'Coins:', this.currentUser.coins);

            // Force update smart quest UI to ensure it displays
            setTimeout(() => {
                this.updateSmartQuestUI();
                console.log('Forced smart quest UI update completed');
            }, 100);

            await this.updateStatsUI();
            
            // Force update UI after a delay to ensure DOM is ready
            setTimeout(() => {
                console.log('=== FORCED UI UPDATE AFTER DELAY ===');
                this.updateUI();
                // Hide unlocked titles after UI update
                this.hideUnlockedTitles();
            }, 200);

        } catch (error) {
            console.error('Error loading user data:', error);
            throw error;
        }
    }

    async loadSmartQuestData(email, token) {
        try {
            console.log('[LOAD SMART QUEST DATA] Loading smart quest data for email:', email);
            const response = await fetch(`${getApiUrl('/api/getSmartQuestData')}/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const questData = await response.json();
                console.log('[LOAD SMART QUEST DATA] Backend response:', questData);
                
                // Ensure xpReward and coinReward are set for all smart quests
                if (questData.quests) {
                    this.smartQuests = {
                        calories: {
                            ...questData.quests.calories,
                            xpReward: questData.quests.calories?.xpReward ?? 30,
                            coinReward: questData.quests.calories?.coinReward ?? 10
                        },
                        protein: {
                            ...questData.quests.protein,
                            xpReward: questData.quests.protein?.xpReward ?? 25,
                            coinReward: questData.quests.protein?.coinReward ?? 8
                        }
                    };
                    
                    // Check if quests have been claimed today from backend
                    if (this.currentUser && this.currentUser.smartQuestClaims) {
                        const today = new Date().toISOString().slice(0, 10);
                        const todayClaims = this.currentUser.smartQuestClaims[today] || {};
                        
                        Object.keys(this.smartQuests).forEach(questType => {
                            if (todayClaims[questType]) {
                                console.log(`[LOAD SMART QUEST DATA] Quest ${questType} already claimed today, marking as collected`);
                                this.smartQuests[questType].rewardCollected = true;
                                this.smartQuests[questType].completed = true;
                            }
                        });
                    }
                    
                    console.log('[LOAD SMART QUEST DATA] Smart quests initialized from backend:', this.smartQuests);
                } else {
                    console.log('[LOAD SMART QUEST DATA] No quests data from backend, using defaults');
                    this.initializeDefaultQuests();
                }
            } else {
                console.log('[LOAD SMART QUEST DATA] Backend response not ok, using defaults');
                this.initializeDefaultQuests();
            }
        } catch (error) {
            console.error('[LOAD SMART QUEST DATA] Error loading smart quest data:', error);
            this.initializeDefaultQuests();
        }
        
        // Always ensure smart quests section is visible
        this.ensureSmartQuestsSectionVisible();
    }

    async loadDailyQuestStatus(email, token) {
        try {
            console.log('Loading daily quest status for:', email);
            
            const response = await fetch(`${getApiUrl('/api/getDailyQuestStatus')}/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const questData = await response.json();
                console.log('Daily quest status loaded:', questData);
                
                // Update quest completion status based on backend data
                this.questCompletionStatus = {};
                Object.keys(questData.quests).forEach(questType => {
                    this.questCompletionStatus[questType] = questData.quests[questType].completed;
                });
                
                // Save the quest states to localStorage
                this.saveQuestStates();
                
                console.log('Updated quest completion status:', this.questCompletionStatus);
            } else {
                console.warn('Failed to load daily quest status:', response.status);
            }
        } catch (error) {
            console.error('Error loading daily quest status:', error);
        }
    }

    initializeDefaultQuests() {
        console.log('[INITIALIZE DEFAULT QUESTS] Setting up default smart quests');
        this.smartQuests = {
            calories: {
                questType: 'calories',
                questName: 'Calorie Target',
                target: 2000,
                currentProgress: 0,
                completed: false,
                xpReward: 30,
                coinReward: 10,
                scaling: false
            },
            protein: {
                questType: 'protein',
                questName: 'Protein Power',
                target: 100,
                currentProgress: 0,
                completed: false,
                xpReward: 25,
                coinReward: 8,
                scaling: false
            }
        };
        console.log('[INITIALIZE DEFAULT QUESTS] Default smart quests set:', this.smartQuests);
    }

    ensureSmartQuestsSectionVisible() {
        const smartQuestsSection = document.querySelector('.smart-quests-section');
        if (smartQuestsSection) {
            // Force all visibility properties
            smartQuestsSection.style.display = 'block';
            smartQuestsSection.style.visibility = 'visible';
            smartQuestsSection.style.opacity = '1';
            smartQuestsSection.style.height = 'auto';
            smartQuestsSection.style.overflow = 'visible';
            smartQuestsSection.style.position = 'static';
            smartQuestsSection.style.zIndex = '1';
            console.log('[ENSURE VISIBLE] Smart quests section is now visible');
            
            // Also ensure all quest items are visible
            const questItems = smartQuestsSection.querySelectorAll('.quest-item');
            questItems.forEach((item, index) => {
                item.style.display = 'block';
                item.style.visibility = 'visible';
                item.style.opacity = '1';
                item.style.height = 'auto';
                item.style.overflow = 'visible';
                console.log(`[ENSURE VISIBLE] Quest item ${index + 1} is now visible`);
            });
            
            // Check if the section is actually visible
            const rect = smartQuestsSection.getBoundingClientRect();
            console.log('[ENSURE VISIBLE] Smart quests section bounds:', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0
            });
        } else {
            console.error('[ENSURE VISIBLE] Smart quests section not found in DOM');
            
            // Try to find it with different selectors
            const alternativeSelectors = [
                '[data-quest="calories"]',
                '[data-quest="protein"]',
                '.quest-scaling-grid',
                'section h2:contains("Smart Daily Quests")'
            ];
            
            alternativeSelectors.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`[ENSURE VISIBLE] Found element with selector: ${selector}`);
                }
            });
            
            // Log all sections to see what's available
            const allSections = document.querySelectorAll('section');
            console.log('[ENSURE VISIBLE] All sections found:', Array.from(allSections).map(s => ({
                className: s.className,
                id: s.id,
                textContent: s.textContent.substring(0, 50)
            })));
        }
    }

    clearCachedQuestData() {
        console.log('[CLEAR CACHE] Starting cache cleanup...');
        
        // Clear any cached quest data from localStorage
        const keysToRemove = [
            'questCompletionStatus',
            'smartQuestData',
            'dailyQuestData',
            'questStates',
            'smartQuestStates',
            'dailyQuestStates'
        ];
        
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`[CLEAR CACHE] Removed cached data: ${key}`);
            }
        });
        
        // Reset quest completion status
        this.questCompletionStatus = {};
        console.log('[CLEAR CACHE] Reset quest completion status');
        
        // Force clear any remaining quest-related data
        const allKeys = Object.keys(localStorage);
        const questRelatedKeys = allKeys.filter(key => 
            key.toLowerCase().includes('quest') || 
            key.toLowerCase().includes('smart') || 
            key.toLowerCase().includes('daily')
        );
        
        questRelatedKeys.forEach(key => {
            if (!key.includes('userData') && !key.includes('authToken')) {
                localStorage.removeItem(key);
                console.log(`[CLEAR CACHE] Removed quest-related data: ${key}`);
            }
        });
        
        console.log('[CLEAR CACHE] Cache cleanup completed');
    }

    checkSmartQuestsSectionExists() {
        console.log('[CHECK SECTION] Checking if Smart Daily Quests section exists...');
        
        // Check for the main section
        const smartQuestsSection = document.querySelector('.smart-quests-section');
        if (smartQuestsSection) {
            console.log('[CHECK SECTION] ✅ Smart quests section found!');
            console.log('[CHECK SECTION] Section details:', {
                className: smartQuestsSection.className,
                id: smartQuestsSection.id,
                textContent: smartQuestsSection.textContent.substring(0, 100),
                children: smartQuestsSection.children.length
            });
        } else {
            console.error('[CHECK SECTION] ❌ Smart quests section NOT found!');
        }
        
        // Check for individual quest items
        const caloriesQuest = document.querySelector('[data-quest="calories"]');
        const proteinQuest = document.querySelector('[data-quest="protein"]');
        
        if (caloriesQuest) {
            console.log('[CHECK SECTION] ✅ Calories quest found!');
        } else {
            console.error('[CHECK SECTION] ❌ Calories quest NOT found!');
        }
        
        if (proteinQuest) {
            console.log('[CHECK SECTION] ✅ Protein quest found!');
        } else {
            console.error('[CHECK SECTION] ❌ Protein quest NOT found!');
        }
        
        // Check for the quest grid
        const questGrid = document.querySelector('.quest-scaling-grid');
        if (questGrid) {
            console.log('[CHECK SECTION] ✅ Quest grid found!');
        } else {
            console.error('[CHECK SECTION] ❌ Quest grid NOT found!');
        }
        
        // Log all sections to see what's available
        const allSections = document.querySelectorAll('section');
        console.log('[CHECK SECTION] All sections found:', Array.from(allSections).map(s => ({
            className: s.className,
            id: s.id,
            textContent: s.textContent.substring(0, 50)
        })));
    }

    initializeQuests() {
        // Initialize smart quests with default values first
        this.smartQuests = {
            calories: {
                questType: 'calories',
                questName: 'Calorie Target',
                target: this.calculateCalorieGoal(),
                currentProgress: 0, // Will be updated by loadSmartQuestData
                completed: false,
                xpReward: 30,
                coinReward: 10,
                scaling: false
            },
            protein: {
                questType: 'protein',
                questName: 'Protein Power',
                target: this.calculateProteinGoal(),
                currentProgress: 0, // Will be updated by loadSmartQuestData
                completed: false,
                xpReward: 25,
                coinReward: 8,
                scaling: false
            }
        };

        // Initialize mini challenges
        this.miniChallenges = {
            'night-walk': {
                name: 'Night Walk',
                description: 'Walk after 7 PM',
                cost: 15,
                xpReward: 20,
                badgeReward: 'Moonwalker',
                icon: '🌙',
                unlocked: false,
                completed: false
            },
            'fruit-day': {
                name: 'Fruit Day',
                description: 'Log 3 fruits today',
                cost: 20,
                xpReward: 30,
                badgeReward: 'Avatar Hat',
                icon: '🍎',
                unlocked: false,
                completed: false
            },
            'hydration-hero': {
                name: 'Hydration Hero',
                description: 'Drink 3L water',
                cost: 25,
                xpReward: 40,
                badgeReward: 'Water Badge + 2x XP',
                icon: '🚿',
                unlocked: false,
                completed: false
            }
        };

        // Initialize titles
        this.availableTitles = {
            'meal-master': {
                name: 'Meal Master',
                description: 'Expert at planning healthy meals',
                cost: 75,
                icon: '👨‍🍳',
                progress: 0,
                target: 50,
                unlocked: true
            },
            'strength-warrior': {
                name: 'Strength Warrior',
                description: 'Master of strength training',
                cost: 150,
                icon: '💪',
                progress: 0,
                target: 100,
                unlocked: false
            },
            'cardio-king': {
                name: 'Cardio King',
                description: 'Endurance and cardio expert',
                cost: 200,
                icon: '🏃‍♀️',
                progress: 0,
                target: 100,
                unlocked: false
            },
            'yoga-guru': {
                name: 'Yoga Guru',
                description: 'Flexibility and mindfulness master',
                cost: 120,
                icon: '🧘‍♀️',
                progress: 0,
                target: 50,
                unlocked: false
            },
            'nutrition-expert': {
                name: 'Nutrition Expert',
                description: 'Deep knowledge of nutrition',
                cost: 100,
                icon: '🥗',
                progress: 0,
                target: 30,
                unlocked: true
            },
            'consistency-champion': {
                name: 'Consistency Champion',
                description: 'Unwavering dedication to fitness',
                cost: 80,
                icon: '📈',
                progress: 0,
                target: 7,
                unlocked: true
            },
            'goal-crusher': {
                name: 'Goal Crusher',
                description: 'Achieved multiple fitness goals',
                cost: 300,
                icon: '🎯',
                progress: 0,
                target: 5,
                unlocked: false
            },
            'fitness-legend': {
                name: 'Fitness Legend',
                description: 'Ultimate fitness achievement',
                cost: 500,
                icon: '👑',
                progress: 0,
                target: 10,
                unlocked: false
            },
            'wellness-guru': {
                name: 'Wellness Guru',
                description: 'Master of holistic wellness',
                cost: 250,
                icon: '🌟',
                progress: 0,
                target: 1,
                unlocked: true
            },
            'protein-beast': {
                name: 'Protein Beast',
                description: 'Avg. 100g protein/day',
                cost: 100,
                icon: '💪',
                progress: 0,
                target: 100,
                unlocked: false
            },
            'streak-legend': {
                name: 'Streak Legend',
                description: '14-day perfect activity streak',
                cost: 200,
                icon: '🔥',
                progress: 0,
                target: 14,
                unlocked: false
            }
        };

    }



    calculateCalorieGoal() {
        if (!this.currentUser.weight || !this.currentUser.height || !this.currentUser.age) {
            return 2000; // Default
        }

        // Basic BMR calculation
        const bmr = this.currentUser.gender === 'male'
            ? (88.362 + (13.397 * this.currentUser.weight) + (4.799 * this.currentUser.height) - (5.677 * this.currentUser.age))
            : (447.593 + (9.247 * this.currentUser.weight) + (3.098 * this.currentUser.height) - (4.330 * this.currentUser.age));

        const activityMultipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'very': 1.725
        };

        const multiplier = activityMultipliers[this.currentUser.activityLevel] || 1.375;
        return Math.round(bmr * multiplier);
    }

    calculateProteinGoal() {
        const weight = this.currentUser.weight || 70;
        const goal = this.currentUser.primaryGoal;

        if (goal === 'muscle_gain') return Math.round(weight * 2.2); // 2.2g per kg
        if (goal === 'weight_loss') return Math.round(weight * 1.8); // 1.8g per kg
        return Math.round(weight * 1.6); // Standard 1.6g per kg
    }



    async getTodayCalories() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('No auth token found for calories fetch');
                return 0;
            }

            const decoded = window.jwt_decode(token);
            const userId = decoded._id;

            const response = await fetch(`${getApiUrl('/api/foodentry/daily-totals')}/${userId}?date=${this.todayDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const totals = await response.json();
                return totals.calories || 0;
            } else {
                console.warn(`Failed to fetch calories: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching calories:', error);
        }

        // Fallback to local data
        const todayLog = this.currentUser.foodLogs?.find(log => log.date === this.todayDate);
        return todayLog ? todayLog.calories || 0 : 0;
    }

    async getTodayProtein() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('No auth token found for protein fetch');
                return 0;
            }

            const decoded = window.jwt_decode(token);
            const userId = decoded._id;

            const response = await fetch(`${getApiUrl('/api/foodentry/daily-totals')}/${userId}?date=${this.todayDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const totals = await response.json();
                return totals.protein || 0;
            } else {
                console.warn(`Failed to fetch protein: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching protein:', error);
        }

        // Fallback to local data
        const todayLog = this.currentUser.foodLogs?.find(log => log.date === this.todayDate);
        return todayLog ? todayLog.protein || 0 : 0;
    }

    setupEventListeners() {
        // Smart Daily Quest interactions
        document.querySelectorAll('.smart-quests-section .quest-item').forEach(questItem => {
            const questType = questItem.dataset.quest;
            if (questType) {
                questItem.addEventListener('click', () => {
                    this.handleSmartQuestClick(questType);
                });
            }
        });

        // Regular Daily Quest checkboxes
        document.querySelectorAll('.quest-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const questItem = e.target.closest('.checklist-item');
                const questType = questItem.dataset.quest;
                this.handleRegularQuestToggle(questType, e.target.checked);
            });
        });

        // Challenge unlock buttons removed - only titles are used now

        // Title unlock buttons
        document.querySelectorAll('.unlock-title-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Check if button is disabled
                if (e.target.disabled || e.target.classList.contains('disabled')) {
                    return;
                }
                
                const cost = parseInt(e.target.dataset.cost);
                const titleCard = e.target.closest('.title-card');
                const titleId = titleCard.dataset.title;
                this.showUnlockModal(cost, 'title', () => {
                    this.unlockTitle(titleId, cost);
                });
            });
        });





        // Badge unlock buttons removed - only titles are used now
    }



    async handleSmartQuestClick(questType) {
        const quest = this.smartQuests[questType];
        if (!quest) return;

        // Show current progress
        this.showNotification(
            `${quest.questName}: ${quest.currentProgress}/${quest.target} (${Math.round((quest.currentProgress / quest.target) * 100)}%)`,
            'info'
        );
    }

    async handleRegularQuestToggle(questType, isCompleted) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('No auth token found for quest toggle');
                return;
            }

            // Update quest in backend
            const response = await fetch(`${getApiUrl('/api/updateDailyQuest')}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    questType: questType,
                    progress: isCompleted ? 1 : 0,
                    completed: isCompleted
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.xp !== undefined) this.currentUser.exp = result.xp;
                if (result.coins !== undefined) this.currentUser.coins = result.coins;
                if (result.level !== undefined) this.currentUser.level = result.level;

                if (isCompleted) {
                    // Mark as completed in local state
                    this.questCompletionStatus[questType] = true;
                    
                    // Immediately hide the completed quest
                    const questItem = document.querySelector(`[data-quest="${questType}"]`);
                    if (questItem) {
                        questItem.style.display = 'none';
                        questItem.classList.add('quest-completed');
                    }
                    
                    // Save quest states to localStorage
                    this.saveQuestStates();
                } else {
                    // Quest unchecked - show it again and remove from completion status
                    this.questCompletionStatus[questType] = false;
                    
                    // Show the quest again
                    const questItem = document.querySelector(`[data-quest="${questType}"]`);
                    if (questItem) {
                        questItem.style.display = 'flex';
                        questItem.classList.remove('quest-completed');
                    }
                    
                    // Save quest states to localStorage
                    this.saveQuestStates();
                }

                // Refresh smart quest data to get updated progress
                await this.refreshSmartQuestData();
                this.updateSmartQuestUI();
            } else {
                console.warn('Failed to update quest in backend');
            }
        } catch (error) {
            console.error('Error updating quest:', error);
        }
        await this.updateStatsUI();
    }

    async completeQuest(questType, isRegularQuest = false) {
        try {
            // For smart quests, prevent double completion
            // For regular quests, allow multiple toggles for steps, lock others after completion
            if (!isRegularQuest && this.questCompletionStatus[questType]) {
                console.log('Quest already completed:', questType);
                return;
            }

            const quest = isRegularQuest ? this.getRegularQuestData(questType) : this.smartQuests[questType];
            if (!quest) {
                console.error('Quest data not found for:', questType);
                this.showNotification(`Quest data not found for ${questType}`, 'error');
                return;
            }

            const xpGained = quest.xpReward || this.getQuestXP(questType);
            const coinsGained = quest.coinReward || this.getQuestCoins(questType);

            // Update user stats locally
            this.currentUser.exp += xpGained;
            this.currentUser.coins += coinsGained;

            // Check for level up
            const oldLevel = this.currentUser.level;
            this.currentUser.level = this.calculateLevel(this.currentUser.exp);
            const leveledUp = this.currentUser.level > oldLevel;
            console.log('[DEBUG] Level check:', { oldLevel, newLevel: this.currentUser.level, exp: this.currentUser.exp });

            // Mark as completed
            this.questCompletionStatus[questType] = true;
            if (!isRegularQuest) {
                quest.completed = true;
            }

            // Add to activity log locally
            const activity = {
                type: 'quest',
                questType: questType,
                date: new Date(),
                details: `Completed ${quest.questName || questType}`,
                xpGained: xpGained,
                coinsGained: coinsGained
            };

            this.currentUser.activityLog.unshift(activity);
            if (this.currentUser.activityLog.length > 50) {
                this.currentUser.activityLog = this.currentUser.activityLog.slice(0, 50);
            }

            // Update quest stats
            this.updateQuestStats();

            // Save states
            this.saveQuestStates();
            this.saveUserDataToStorage();

            // Update UI
            this.updateUI();
            
            // For regular quests, immediately hide the completed quest
            if (isRegularQuest) {
                const questItem = document.querySelector(`[data-quest="${questType}"]`);
                if (questItem) {
                    questItem.style.display = 'none';
                    questItem.classList.add('quest-completed');
                }
            }

            // Show notifications
            this.showNotification(
                `Quest completed! +${xpGained} XP, +${coinsGained} coins`,
                'success'
            );

            // Log coin balance update for debugging
            console.log(`Quest ${questType} completed. Coins gained: ${coinsGained}. New balance: ${this.currentUser.coins}`);

            if (leveledUp) {
                this.showLevelUpNotification(this.currentUser.level);
            }

            // Try to sync with backend (non-blocking)
            this.syncQuestWithBackend(questType, quest);

        } catch (error) {
            console.error('Error completing quest:', error);
            this.showNotification(`Failed to complete quest: ${error.message}`, 'error');
        }
        await this.updateStatsUI();
    }

    async syncQuestWithBackend(questType, quest) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('No auth token found for quest sync');
                return;
            }

            const response = await fetch(`${getApiUrl('/api/updateDailyQuest')}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    questType: questType,
                    progress: quest.currentProgress || 1,
                    completed: true
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[SYNC QUEST] Backend response:', result);
                
                // Update local user data with backend response
                if (result.xp !== undefined) {
                    console.log('[SYNC QUEST] Updating XP from backend:', result.xp);
                    this.currentUser.exp = result.xp;
                }
                if (result.coins !== undefined) {
                    console.log('[SYNC QUEST] Updating coins from backend:', result.coins);
                    this.currentUser.coins = result.coins;
                }
                if (result.level !== undefined) {
                    console.log('[SYNC QUEST] Updating level from backend:', result.level);
                    this.currentUser.level = result.level;
                }
                if (result.questStats) {
                    console.log('[SYNC QUEST] Updating quest stats from backend:', result.questStats);
                    this.currentUser.questStats = result.questStats;
                }

                // Handle unlocked titles from backend
                if (result.unlockedTitles && result.unlockedTitles.length > 0) {
                    console.log('[SYNC QUEST] Titles unlocked from backend:', result.unlockedTitles);
                    result.unlockedTitles.forEach(titleId => {
                        this.updateTitleUI(titleId);
                        this.showNotification(`🏆 Unlocked "${this.getTitleName(titleId)}" title!`, 'success');
                    });
                }

                // Save the updated data to localStorage
                this.saveUserDataToStorage();

                // Force UI update to reflect the backend changes
                this.updateUI();
                this.updateTitleProgress(); // Update title progress after quest stats change
                console.log('[SYNC QUEST] UI updated with backend data. XP:', this.currentUser.exp, 'Level:', this.currentUser.level, 'Coins:', this.currentUser.coins);
            } else {
                console.warn('Failed to sync quest with backend:', response.statusText);
            }
        } catch (error) {
            console.warn('Backend sync failed:', error);
            // Continue working offline
        }
        await this.updateStatsUI();
    }

    async syncUserDataToBackend() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('No auth token found for user data sync');
                return;
            }

            const requestBody = {
                exp: this.currentUser.exp,
                level: this.currentUser.level,
                coins: this.currentUser.coins,
                titles: this.currentUser.titles,
                selectedTitle: this.currentUser.selectedTitle,
                activityLog: this.currentUser.activityLog,
                questStats: this.currentUser.questStats
            };

            console.log('[SYNC USER DATA] Sending updated user data to backend:', requestBody);

            const response = await fetch(`${getApiUrl('/api/updateUser')}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[SYNC USER DATA] User data synced successfully:', result);
            } else {
                console.warn('[SYNC USER DATA] Failed to sync user data:', response.statusText);
            }
        } catch (error) {
            console.warn('[SYNC USER DATA] User data sync failed:', error);
        }
    }

    getRegularQuestData(questType) {
        const questData = {
            water: { questName: 'Hydration Master', xpReward: 25, coinReward: 5 },
            sleep: { questName: 'Sleep Warrior', xpReward: 30, coinReward: 8 },
            meal: { questName: 'Nutrition Tracker', xpReward: 20, coinReward: 5 },
            exercise: { questName: 'Fitness Fanatic', xpReward: 60, coinReward: 18 }
        };
        return questData[questType];
    }

    updateQuestStats() {
        if (!this.currentUser.questStats) {
            this.currentUser.questStats = {
                totalQuestsCompleted: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastQuestDate: null,
                stepGoalHistory: [],
                proteinStreak: 0,
                proteinLongestStreak: 0,
                proteinLastCompletedDate: null,
                calorieStreak: 0,
                calorieLongestStreak: 0,
                calorieLastCompletedDate: null
            };
        }

        const completedToday = Object.values(this.questCompletionStatus).filter(Boolean).length;

        if (completedToday > 0) {
            const today = this.todayDate;

            if (this.currentUser.questStats.lastQuestDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().slice(0, 10);

                if (this.currentUser.questStats.lastQuestDate === yesterdayStr) {
                    // Continuing streak
                    this.currentUser.questStats.currentStreak += 1;
                } else {
                    // New streak starts
                    this.currentUser.questStats.currentStreak = 1;
                }

                // Update longest streak
                if (this.currentUser.questStats.currentStreak > this.currentUser.questStats.longestStreak) {
                    this.currentUser.questStats.longestStreak = this.currentUser.questStats.currentStreak;
                }

                this.currentUser.questStats.lastQuestDate = today;
            }
        }

        this.currentUser.questStats.totalQuestsCompleted = (this.currentUser.questStats.totalQuestsCompleted || 0) + 1;
    }

    // unlockChallenge function removed - only titles are used now

    async unlockTitle(titleId, cost, isAutoUnlock = false) {
        console.log('🏆 UNLOCK TITLE CALLED:', titleId, 'Cost:', cost, 'Auto Unlock:', isAutoUnlock);
        
        // Check if user can unlock this title
        const canUnlock = this.canUnlockTitle(titleId, cost);
        if (!canUnlock.allowed) {
            this.showNotification(canUnlock.message, 'error');
            return;
        }

        // Determine if this is a coin purchase or achievement unlock
        const isCoinPurchase = !isAutoUnlock && canUnlock.reason === 'coins_purchase';
        const isAchievementUnlock = isAutoUnlock || canUnlock.reason === 'requirements_met';

        // Handle coin deduction
        if (isCoinPurchase) {
            // Deduct coins for manual coin purchases
            this.currentUser.coins -= cost;
            console.log('🏆 Coins deducted for coin purchase. New balance:', this.currentUser.coins);
        } else {
            console.log('🏆 Achievement unlock - no coins deducted');
        }

        // Add title
        const newTitle = {
            titleId: titleId,
            title: this.getTitleName(titleId),
            unlockedAt: new Date()
        };
        this.currentUser.titles.push(newTitle);
        console.log('🏆 Title added to user. Total titles:', this.currentUser.titles.length);

        // Set the newly unlocked title as active
        this.currentUser.selectedTitle = titleId;
        console.log('🏆 Set newly unlocked title as active:', titleId);

        // Update UI
        this.updateTitleUI(titleId);

        // Add to activity log
        const activity = {
            type: 'title',
            date: new Date(),
            details: isAchievementUnlock ? `Achieved title: ${newTitle.title}` : `Purchased title: ${newTitle.title}`,
            coinsSpent: isCoinPurchase ? cost : 0
        };
        this.currentUser.activityLog.unshift(activity);

        this.saveUserDataToStorage();
        this.updateUI();
        
        // Check if all titles are unlocked and update upcoming section
        this.updateUpcomingTitlesSection();
        
        // Show appropriate notification
        if (isAchievementUnlock) {
            this.showNotification(`🎉 Title achieved: ${newTitle.title}!`, 'success');
        } else {
            this.showNotification(`Title purchased! -${cost} coins`, 'success');
        }

        // Update sidebar to show the new title
        if (window.sharedSidebar) {
            window.sharedSidebar.refreshDisplay();
        }

        // Refresh settings page titles if it's open
        if (window.refreshSettingsTitles) {
            window.refreshSettingsTitles();
        }

        // Sync with backend
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                const requestBody = {
                    coins: this.currentUser.coins,
                    titles: this.currentUser.titles,
                    activityLog: this.currentUser.activityLog,
                    selectedTitle: this.currentUser.selectedTitle,
                };
                console.log('🏆 Sending title unlock to backend:', requestBody);
                
                const response = await fetch(`${getApiUrl('/api/updateUser')}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                });
                console.log('🏆 Backend response status:', response.status);
                if (response.ok) {
                    const result = await response.json();
                    console.log('🏆 Title unlock backend sync successful:', result);
                } else {
                    const errorText = await response.text();
                    console.warn('🏆 Title unlock backend sync failed:', response.statusText, errorText);
                }
            }
        } catch (error) {
            console.error('🏆 Title unlock backend sync error:', error);
        }
    }

    // Check if user meets requirements for a specific title
    checkTitleRequirements(titleId) {
        const questStats = this.currentUser.questStats || {};
        
        switch (titleId) {
            case 'nutrition-expert':
                const calorieStreak = questStats.calorieStreak || 0;
                if (calorieStreak < 5) {
                    return {
                        allowed: false,
                        message: `Need 5+ day calorie streak! Current: ${calorieStreak} days`
                    };
                }
                break;
                
            case 'protein-beast':
                const proteinStreak = questStats.proteinStreak || 0;
                if (proteinStreak < 5) {
                    return {
                        allowed: false,
                        message: `Need 5+ day protein streak! Current: ${proteinStreak} days`
                    };
                }
                break;
                
            case 'streak-legend':
                const questStreak = questStats.currentStreak || 0;
                if (questStreak < 7) {
                    return {
                        allowed: false,
                        message: `Need 7+ day quest streak! Current: ${questStreak} days`
                    };
                }
                break;
                
            default:
                return { allowed: true, message: 'Requirements met' };
        }
        
        return { allowed: true, message: 'Requirements met' };
    }

    // Check if user can unlock title (either by meeting requirements or having coins)
    canUnlockTitle(titleId, cost) {
        // First check if requirements are met (for auto unlock)
        const requirementsCheck = this.checkTitleRequirements(titleId);
        if (requirementsCheck.allowed) {
            return { allowed: true, reason: 'requirements_met', message: 'Requirements met' };
        }
        
        // If requirements not met, check if user has enough coins
        if (this.currentUser.coins >= cost) {
            return { allowed: true, reason: 'coins_purchase', message: 'Can unlock with coins' };
        }
        
        // Neither requirements met nor enough coins
        return { 
            allowed: false, 
            reason: 'insufficient_resources', 
            message: `Need ${cost} coins or meet requirements: ${requirementsCheck.message}` 
        };
    }

    // Check if a title is already unlocked
    isTitleUnlocked(titleId) {
        return this.currentUser.titles && this.currentUser.titles.some(title => title.titleId === titleId);
    }

    // Check if all available titles are unlocked
    areAllTitlesUnlocked() {
        const availableTitleIds = ['nutrition-expert', 'protein-beast', 'streak-legend'];
        return availableTitleIds.every(titleId => this.isTitleUnlocked(titleId));
    }

    // Show or hide upcoming titles section
    updateUpcomingTitlesSection() {
        const upcomingSection = document.getElementById('upcoming-titles-section');
        const titlesGrid = document.getElementById('titles-grid');
        
        if (!upcomingSection || !titlesGrid) return;
        
        if (this.areAllTitlesUnlocked()) {
            // Hide the main titles grid
            titlesGrid.style.display = 'none';
            // Show upcoming titles section
            upcomingSection.style.display = 'block';
            
            // Show achievement notification
            this.showNotification('🎉 All titles unlocked! Check out upcoming challenges!', 'success');
        } else {
            // Show the main titles grid
            titlesGrid.style.display = 'grid';
            // Hide upcoming titles section
            upcomingSection.style.display = 'none';
        }
    }

    // Auto unlock title when requirements are met
    async autoUnlockTitle(titleId, cost) {
        console.log(`🏆 AUTO UNLOCKING TITLE: ${titleId}`);
        
        // Call unlockTitle with isAutoUnlock = true
        await this.unlockTitle(titleId, cost, true);
        
        // Show special achievement notification
        this.showAchievementNotification(titleId);
    }

    // Show special achievement notification
    showAchievementNotification(titleId) {
        const titleName = this.getTitleName(titleId);
        
        // Create achievement notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-text">
                    <h3>Achievement Unlocked!</h3>
                    <p>${titleName}</p>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Share achievement with friends
        this.shareAchievementWithFriends(titleName);
        
        // Show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }

    async shareAchievementWithFriends(achievement) {
        try {
            const userData = JSON.parse(localStorage.getItem('userData')) || JSON.parse(localStorage.getItem('currentUser'));
            if (!userData || !userData.email) return;

            const response = await fetch(getApiUrl('/api/activities/share-achievement'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userEmail: userData.email,
                    achievement: `unlocked ${achievement} title`,
                    xpGained: 0
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Achievement shared with friends:', result);
            }
        } catch (error) {
            console.error('Error sharing achievement with friends:', error);
        }
    }

    // unlockBadge function removed - only titles are used now

    // Badge sync functions removed - only titles are used now

    getTitleName(titleId) {
        const titles = {
            'fitness-novice': 'Fitness Novice',
            'meal-master': 'Meal Master',
            'strength-warrior': 'Strength Warrior',
            'cardio-king': 'Cardio King',
            'yoga-guru': 'Yoga Guru',
            'nutrition-expert': 'Nutrition Expert',
            'consistency-champion': 'Consistency Champion',
            'goal-crusher': 'Goal Crusher',
            'fitness-legend': 'Fitness Legend',
            'wellness-guru': 'Wellness Guru',
            'protein-beast': 'Protein Beast',
            'streak-legend': 'Streak Legend'
        };
        return titles[titleId] || titleId;
    }

    updateUI() {
        console.log('=== UPDATE UI START ===');
        console.log('Current user data:', {
            level: this.currentUser.level,
            exp: this.currentUser.exp,
            coins: this.currentUser.coins
        });

        // Update coin balance
        const coinBalance = document.querySelector('.coin-balance');
        if (coinBalance) {
            const newCoinBalance = this.currentUser.coins || 0;
            coinBalance.textContent = newCoinBalance;
            console.log('✅ Coin balance updated:', newCoinBalance);
        } else {
            console.log('❌ Coin balance element not found');
        }

        // Update level and XP
        const currentLevel = this.currentUser.level;
        const currentXP = this.currentUser.exp;
        const currentLevelXP = this.getXPForLevel(currentLevel - 1);
        const nextLevelXP = this.getXPForLevel(currentLevel);
        const progressXP = currentXP - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const progressPercent = Math.min((progressXP / neededXP) * 100, 100);

        console.log('Level calculation:', {
            currentLevel,
            currentXP,
            currentLevelXP,
            nextLevelXP,
            progressXP,
            neededXP,
            progressPercent
        });

        // Update level progress section
        const currentLevelEl = document.querySelector('.current-level');
        if (currentLevelEl) {
            currentLevelEl.textContent = `Level ${currentLevel}`;
            currentLevelEl.innerHTML = `Level ${currentLevel}`;
            console.log('✅ Level progress updated:', `Level ${currentLevel}`);
            console.log('Element content after update:', currentLevelEl.textContent);
        } else {
            console.log('❌ Level progress element not found');
        }

        const xpDisplay = document.querySelector('.xp');
        if (xpDisplay) {
            xpDisplay.textContent = `${progressXP}/${neededXP} XP`;
            xpDisplay.innerHTML = `${progressXP}/${neededXP} XP`;
            console.log('✅ XP display updated:', `${progressXP}/${neededXP} XP`);
            console.log('Element content after update:', xpDisplay.textContent);
            console.log('XP calculation details:', {
                currentXP: currentXP,
                currentLevelXP: currentLevelXP,
                nextLevelXP: nextLevelXP,
                progressXP: progressXP,
                neededXP: neededXP
            });
        } else {
            console.log('❌ XP display element not found');
        }

        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
            console.log('✅ Progress bar updated:', `${progressPercent}%`);
            console.log('Element style after update:', progressFill.style.width);
        } else {
            console.log('❌ Progress bar element not found');
        }

        // Update user stats section
        const levelStatValue = document.querySelector('[data-stat="level"]');
        if (levelStatValue) {
            levelStatValue.textContent = currentLevel;
            console.log('✅ Level stat updated:', currentLevel);
        } else {
            console.log('❌ Level stat element not found');
        }

        const xpStatValue = document.querySelector('[data-stat="xp"]');
        if (xpStatValue) {
            xpStatValue.textContent = currentXP.toLocaleString();
            console.log('✅ XP stat updated:', currentXP.toLocaleString());
        } else {
            console.log('❌ XP stat element not found');
        }

        const rankStatValue = document.querySelector('[data-stat="rank"]');
        if (rankStatValue) {
            // Show loading state first
            rankStatValue.textContent = '...';
            
            // Get real rank from backend (async, but don't await here)
            this.getRealRank(this.currentUser.email).then(realRank => {
                rankStatValue.textContent = `#${realRank}`;
                console.log('✅ Real rank updated:', `#${realRank}`);
            }).catch(error => {
                // Fallback to calculated rank
                const fallbackRank = this.calculateRank(currentXP);
                rankStatValue.textContent = `#${fallbackRank}`;
                console.log('✅ Fallback rank updated:', `#${fallbackRank}`);
            });
        } else {
            console.log('❌ Rank stat element not found');
        }

        const streakStatValue = document.querySelector('[data-stat="streak"]');
        if (streakStatValue) {
            const streak = this.currentUser.questStats?.currentStreak || 0;
            streakStatValue.textContent = streak;
            console.log('✅ Streak stat updated:', streak);
        } else {
            console.log('❌ Streak stat element not found');
        }

        console.log('=== UPDATE UI END ===');

        // Update summary cards
        const caloriesDisplay = document.getElementById('calories-display');
        const proteinDisplay = document.getElementById('protein-display');

        if (caloriesDisplay && this.smartQuests && this.smartQuests.calories) {
            const calories = this.smartQuests.calories.currentProgress || 0;
            caloriesDisplay.textContent = calories;
        }
        if (proteinDisplay && this.smartQuests && this.smartQuests.protein) {
            const protein = this.smartQuests.protein.currentProgress || 0;
            proteinDisplay.textContent = protein;
        }

        // Update smart quests UI
        this.updateSmartQuestUI();

        // Update activity list
        this.updateActivityList();

        // Update title progress
        this.updateTitleProgress();

        // Update quest checkboxes
        this.updateRegularQuestUI();
        
        // Hide unlocked titles
        this.hideUnlockedTitles();
    }

    // Function to hide unlocked challenges and titles on page load
    // hideUnlockedItems function removed - only titles are used now

    updateSmartQuestUI() {
        if (!this.smartQuests) {
            console.warn('Smart quests not initialized');
            return;
        }

        // Ensure the smart quests section is visible
        this.ensureSmartQuestsSectionVisible();

        console.log('Updating smart quest UI with data:', this.smartQuests);

        Object.keys(this.smartQuests).forEach(questType => {
            const quest = this.smartQuests[questType];
            if (!quest) {
                console.warn(`Quest data not found for: ${questType}`);
                return;
            }

            const questItem = document.querySelector(`.smart-quests-section [data-quest="${questType}"]`);
            console.log(`Looking for quest item: ${questType}`, questItem);

            if (!questItem) {
                console.error(`Quest item not found for: ${questType}`);
                return;
            }

            // Hide quest if reward has been collected today
            if (quest.rewardCollected) {
                console.log(`Hiding ${questType} quest - reward already collected today`);
                
                // Add classes for styling
                questItem.classList.add('quest-completed');
                questItem.classList.add('reward-collected');
                
                // Smooth hide animation to prevent layout shifts
                questItem.style.transition = 'all 0.3s ease';
                questItem.style.opacity = '0';
                questItem.style.transform = 'scale(0.8)';
                
                // After animation, hide completely
                setTimeout(() => {
                    questItem.style.display = 'none';
                    questItem.style.height = '0';
                    questItem.style.margin = '0';
                    questItem.style.padding = '0';
                    questItem.style.overflow = 'hidden';
                }, 300);
                
                return; // Skip updating this quest's UI
            }

            if (questItem) {
                const goalEl = questItem.querySelector('.current-goal');
                const progressFill = questItem.querySelector('.progress-fill');
                const progressText = questItem.querySelector('.progress-text');
                const rewardXp = questItem.querySelector('.reward-xp');
                const rewardCoins = questItem.querySelector('.reward-coins');
                const scalingNotice = questItem.querySelector('.scaling-notice');
                const collectButton = questItem.querySelector('.collect-reward-btn');

                console.log(`Elements found for ${questType}:`, {
                    goalEl: !!goalEl,
                    progressFill: !!progressFill,
                    progressText: !!progressText,
                    rewardXp: !!rewardXp,
                    rewardCoins: !!rewardCoins,
                    scalingNotice: !!scalingNotice,
                    collectButton: !!collectButton
                });

                if (goalEl) {
                    const targetValue = (quest.target || 0).toLocaleString();
                    const oldValue = goalEl.textContent;
                    goalEl.textContent = targetValue;
                    console.log(`Set goal for ${questType}: ${oldValue} → ${targetValue}`);
                } else {
                    console.error(`Goal element not found for ${questType}`);
                }
                if (progressText) {
                    const currentProgress = quest.currentProgress || 0;
                    const target = quest.target || 0;
                    const progressTextValue = `${currentProgress.toLocaleString()} / ${target.toLocaleString()}`;
                    const oldValue = progressText.textContent;
                    progressText.textContent = progressTextValue;
                    console.log(`Set progress for ${questType}: ${oldValue} → ${progressTextValue}`);
                } else {
                    console.error(`Progress text element not found for ${questType}`);
                }

                if (progressFill) {
                    const currentProgress = quest.currentProgress || 0;
                    const target = quest.target || 1; // Avoid division by zero
                    const progressPercent = Math.min((currentProgress / target) * 100, 120);
                    const oldWidth = progressFill.style.width;
                    progressFill.style.width = `${progressPercent}%`;
                    console.log(`Set progress fill for ${questType}: ${oldWidth} → ${progressPercent}% (${currentProgress}/${target})`);

                    // Change color based on completion
                    if (quest.completed) {
                        progressFill.style.background = 'linear-gradient(90deg, #4CAF50, #45a049)';
                        console.log(`Quest ${questType} is completed - setting green color`);
                    } else if (progressPercent > 100) {
                        progressFill.style.background = 'linear-gradient(90deg, #FF9800, #F57C00)';
                        console.log(`Quest ${questType} exceeded target - setting orange color`);
                    } else {
                        progressFill.style.background = 'linear-gradient(90deg, #2196F3, #1976D2)';
                        console.log(`Quest ${questType} in progress - setting blue color`);
                    }

                    // Force a reflow to ensure the style change is applied
                    progressFill.offsetHeight;

                    // Verify the change was applied
                    setTimeout(() => {
                        const actualWidth = progressFill.style.width;
                        console.log(`Verified progress fill for ${questType}: ${actualWidth}`);
                    }, 10);
                } else {
                    console.error(`Progress fill element not found for ${questType}`);
                }

                if (rewardXp) {
                    const xpValue = `+${quest.xpReward || this.getQuestXP(questType)} XP`;
                    rewardXp.textContent = xpValue;
                    console.log(`Set XP reward for ${questType}: ${xpValue} (quest.xpReward: ${quest.xpReward})`);
                }
                if (rewardCoins) {
                    const coinValue = `+${quest.coinReward || this.getQuestCoins(questType)} Coins`;
                    rewardCoins.textContent = coinValue;
                    console.log(`Set coin reward for ${questType}: ${coinValue} (quest.coinReward: ${quest.coinReward})`);
                }

                            // Handle completion state and collect button
            if (quest.completed && !quest.rewardCollected) {
                questItem.classList.add('quest-completed');
                questItem.classList.add('reward-available');

                // Show collect button if it exists
                if (collectButton) {
                    collectButton.style.display = 'block';
                    collectButton.textContent = 'Collect Reward';
                    collectButton.onclick = () => this.collectSmartQuestReward(questType);
                }

                // Add pulsing animation for completed quests
                questItem.style.animation = 'pulse 2s infinite';
                            } else if (quest.completed && quest.rewardCollected) {
                    questItem.classList.add('quest-completed');
                    questItem.classList.remove('reward-available');

                    // Smooth hide animation to prevent layout shifts
                    questItem.style.transition = 'all 0.3s ease';
                    questItem.style.opacity = '0';
                    questItem.style.transform = 'scale(0.8)';
                    
                    // After animation, hide completely
                    setTimeout(() => {
                        questItem.style.display = 'none';
                        questItem.style.height = '0';
                        questItem.style.margin = '0';
                        questItem.style.padding = '0';
                        questItem.style.overflow = 'hidden';
                    }, 300);
                    
                    console.log(`Hiding completed and reward-collected smart quest: ${questType}`);

                    // Remove pulsing animation
                    questItem.style.animation = 'none';
                    
                    // Also hide the collect button specifically
                    if (collectButton) {
                        collectButton.style.display = 'none';
                    }
            } else {
                questItem.classList.remove('quest-completed', 'reward-available');

                // Hide collect button
                if (collectButton) {
                    collectButton.style.display = 'none';
                }

                // Remove pulsing animation
                questItem.style.animation = 'none';

                // Reset progress text styling
                if (progressText) {
                    progressText.style.color = '';
                    progressText.style.fontWeight = '';
                }
            }

                // Show scaling notice if quest is scaling
                if (scalingNotice && quest.scaling && (quest.currentProgress || 0) > (quest.target || 0)) {
                    scalingNotice.style.display = 'block';
                    scalingNotice.textContent = 'Goal exceeded! +10% bonus';
                } else if (scalingNotice) {
                    scalingNotice.style.display = 'none';
                }
            }
        });
    }

    async collectSmartQuestReward(questType) {
        try {
            const quest = this.smartQuests[questType];
            if (!quest || !quest.completed || quest.rewardCollected) {
                this.showNotification('No reward available to collect', 'warning');
                return;
            }

            // Mark reward as collected
            quest.rewardCollected = true;

            // Call backend to claim smart quest reward
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${getApiUrl('/api/claimSmartQuestReward')}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ questType })
            });
            const result = await response.json();
            if (response.ok) {
                // Update user data with new coins/xp and quest stats
                this.currentUser.coins = result.coins;
                this.currentUser.exp = result.xp;
                if (result.questStats) {
                    this.currentUser.questStats = result.questStats;
                }
                this.updateUI();
                this.updateTitleProgress(); // Update title progress after quest stats change
                this.showNotification(`Reward collected! +${result.xpGained} XP, +${result.coinsGained} coins`, 'success');
                
                // Handle unlocked titles from backend
                if (result.unlockedTitles && result.unlockedTitles.length > 0) {
                    console.log('[SMART QUEST] Titles unlocked from backend:', result.unlockedTitles);
                    result.unlockedTitles.forEach(titleId => {
                        this.updateTitleUI(titleId);
                        this.showNotification(`🏆 Unlocked "${this.getTitleName(titleId)}" title!`, 'success');
                    });
                }
                
                // Hide the quest after reward collection with smooth animation
                const questItem = document.querySelector(`.smart-quests-section [data-quest="${questType}"]`);
                if (questItem) {
                    console.log(`Hiding smart quest ${questType} after reward collection`);
                    
                    // Add classes for styling
                    questItem.classList.add('quest-completed');
                    questItem.classList.add('reward-collected');
                    
                    // Smooth hide animation to prevent layout shifts
                    questItem.style.transition = 'all 0.3s ease';
                    questItem.style.opacity = '0';
                    questItem.style.transform = 'scale(0.8)';
                    
                    // After animation, hide completely
                    setTimeout(() => {
                        questItem.style.display = 'none';
                        questItem.style.height = '0';
                        questItem.style.margin = '0';
                        questItem.style.padding = '0';
                        questItem.style.overflow = 'hidden';
                    }, 300);
                }
                
                // Also hide the collect button specifically
                const collectButton = questItem?.querySelector('.collect-reward-btn');
                if (collectButton) {
                    collectButton.style.display = 'none';
                }
            } else {
                this.showNotification(result.error || 'Failed to claim reward', 'error');
            }

            // Save states
            this.saveQuestStates();
            this.saveUserDataToStorage();

            // Don't refresh smart quest data immediately to prevent showing the quest again
            // The quest should stay hidden until the next day
            console.log(`Smart quest ${questType} reward collected and hidden. Will reappear tomorrow.`);
        } catch (error) {
            console.error('Error collecting smart quest reward:', error);
            this.showNotification('Failed to collect reward', 'error');
        }
    }

    updateRegularQuestUI() {
        Object.keys(this.questCompletionStatus).forEach(questType => {
            const checkbox = document.getElementById(`${questType}-quest`);
            if (checkbox) {
                checkbox.checked = this.questCompletionStatus[questType] || false;

                // Update parent styling and visibility
                const questItem = checkbox.closest('.checklist-item');
                if (questItem) {
                    if (this.questCompletionStatus[questType]) {
                        // Hide completed quests completely
                        questItem.style.display = 'none';
                        questItem.classList.add('quest-completed');
                    } else {
                        // Show incomplete quests
                        questItem.style.display = 'flex';
                        questItem.classList.remove('quest-completed');
                    }
                }
            }
        });
    }

    updateTitleUI(titleId) {
        const titleCard = document.querySelector(`[data-title="${titleId}"]`);
        if (titleCard) {
            console.log(`🏆 Removing title card after unlock: ${titleId}`);
            // Remove the entire title card from the DOM
            titleCard.remove();
        }
    }

    updateTitleProgress() {
        console.log('[TITLE PROGRESS] Updating title progress with questStats:', this.currentUser.questStats);
        
        // Update streak legend progress
        const streakLegendCard = document.querySelector('[data-title="streak-legend"]');
        if (streakLegendCard) {
            const currentStreak = this.currentUser.questStats?.currentStreak || 0;
            const targetStreak = 7;
            const progressPercent = Math.min((currentStreak / targetStreak) * 100, 100);
            const progressFill = streakLegendCard.querySelector('.progress-fill');
            const progressText = streakLegendCard.querySelector('.progress-text');
            const unlockBtn = streakLegendCard.querySelector('.unlock-title-btn');
            
            if (progressFill) progressFill.style.width = `${progressPercent}%`;
            if (progressText) progressText.textContent = `${currentStreak}/${targetStreak} days`;
            
            // Check if title should be auto-unlocked
            if (currentStreak >= targetStreak && !this.isTitleUnlocked('streak-legend')) {
                this.autoUnlockTitle('streak-legend', 200);
            }
            
            // Update unlock button state
            if (unlockBtn) {
                const cost = parseInt(unlockBtn.dataset.cost);
                const hasEnoughCoins = this.currentUser.coins >= cost;
                
                if (hasEnoughCoins) {
                    unlockBtn.textContent = 'Unlock';
                    unlockBtn.disabled = false;
                    unlockBtn.classList.remove('disabled');
                } else {
                    unlockBtn.textContent = 'Locked';
                    unlockBtn.disabled = true;
                    unlockBtn.classList.add('disabled');
                }
            }
            
            console.log('[TITLE PROGRESS] Streak Legend updated:', { currentStreak, targetStreak, progressPercent });
        }

        // Update protein beast progress
        const proteinBeastCard = document.querySelector('[data-title="protein-beast"]');
        if (proteinBeastCard) {
            const currentStreak = this.currentUser.questStats?.proteinStreak || 0;
            const targetStreak = 5;
            const progressPercent = Math.min((currentStreak / targetStreak) * 100, 100);
            const progressFill = proteinBeastCard.querySelector('.progress-fill');
            const progressText = proteinBeastCard.querySelector('.progress-text');
            const unlockBtn = proteinBeastCard.querySelector('.unlock-title-btn');
            
            if (progressFill) progressFill.style.width = `${progressPercent}%`;
            if (progressText) progressText.textContent = `${currentStreak}/${targetStreak} days`;
            
            // Check if title should be auto-unlocked
            if (currentStreak >= targetStreak && !this.isTitleUnlocked('protein-beast')) {
                this.autoUnlockTitle('protein-beast', 100);
            }
            
            // Update unlock button state
            if (unlockBtn) {
                const cost = parseInt(unlockBtn.dataset.cost);
                const hasEnoughCoins = this.currentUser.coins >= cost;
                
                if (hasEnoughCoins) {
                    unlockBtn.textContent = 'Unlock';
                    unlockBtn.disabled = false;
                    unlockBtn.classList.remove('disabled');
                } else {
                    unlockBtn.textContent = 'Locked';
                    unlockBtn.disabled = true;
                    unlockBtn.classList.add('disabled');
                }
            }
            
            console.log('[TITLE PROGRESS] Protein Beast updated:', { currentStreak, targetStreak, progressPercent });
        }

        // Update nutrition expert progress
        const nutritionExpertCard = document.querySelector('[data-title="nutrition-expert"]');
        if (nutritionExpertCard) {
            const currentStreak = this.currentUser.questStats?.calorieStreak || 0;
            const targetStreak = 5;
            const progressPercent = Math.min((currentStreak / targetStreak) * 100, 100);
            const progressFill = nutritionExpertCard.querySelector('.progress-fill');
            const progressText = nutritionExpertCard.querySelector('.progress-text');
            const unlockBtn = nutritionExpertCard.querySelector('.unlock-title-btn');
            
            if (progressFill) progressFill.style.width = `${progressPercent}%`;
            if (progressText) progressText.textContent = `${currentStreak}/${targetStreak} days`;
            
            // Check if title should be auto-unlocked
            if (currentStreak >= targetStreak && !this.isTitleUnlocked('nutrition-expert')) {
                this.autoUnlockTitle('nutrition-expert', 100);
            }
            
            // Update unlock button state
            if (unlockBtn) {
                const cost = parseInt(unlockBtn.dataset.cost);
                const hasEnoughCoins = this.currentUser.coins >= cost;
                
                if (hasEnoughCoins) {
                    unlockBtn.textContent = 'Unlock';
                    unlockBtn.disabled = false;
                    unlockBtn.classList.remove('disabled');
                } else {
                    unlockBtn.textContent = 'Locked';
                    unlockBtn.disabled = true;
                    unlockBtn.classList.add('disabled');
                }
            }
            
            console.log('[TITLE PROGRESS] Nutrition Expert updated:', { currentStreak, targetStreak, progressPercent });
        }
        
        // Check if all titles are unlocked and update upcoming section
        this.updateUpcomingTitlesSection();
    }

    // Function to hide unlocked titles on page load
    hideUnlockedTitles() {
        console.log('🏆 Hiding unlocked titles...');
        if (!this.currentUser.titles || this.currentUser.titles.length === 0) {
            console.log('🏆 No titles to hide - user has no unlocked titles');
            return;
        }

        this.currentUser.titles.forEach(title => {
            const titleCard = document.querySelector(`[data-title="${title.titleId}"]`);
            if (titleCard) {
                console.log(`🏆 Removing unlocked title card: ${title.titleId}`);
                // Remove the entire title card from the DOM
                titleCard.remove();
            } else {
                console.log(`🏆 Title card not found for: ${title.titleId}`);
            }
        });
    }

    updateActivityList() {
        if (!this.activityList || !this.currentUser.activityLog) return;

        this.activityList.innerHTML = '';
        this.currentUser.activityLog.slice(0, 10).forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';

            const xpText = activity.xpGained > 0 ? `<span class="activity-xp">+${activity.xpGained} XP</span>` : '';
            const coinsGainedText = activity.coinsGained > 0 ? `<span class="activity-coins">+${activity.coinsGained} coins</span>` : '';
            const coinsSpentText = activity.coinsSpent > 0 ? `<span class="activity-coins">-${activity.coinsSpent} coins</span>` : '';

            activityItem.innerHTML = `
                <span class="activity-icon">${this.getActivityIcon(activity.type, activity.questType)}</span>
                <div class="activity-details">
                    ${xpText}${coinsGainedText}${coinsSpentText}
                    ${activity.details}
                </div>
            `;
            this.activityList.appendChild(activityItem);
        });
    }

    startDataSync() {
        // Sync food log data every 30 seconds
        setInterval(() => {
            this.syncFoodLogData();
        }, 30000);

        // Initial sync
        setTimeout(() => this.syncFoodLogData(), 2000);
    }

    async syncFoodLogData() {
        try {
            // Refresh smart quest data from backend
            await this.refreshSmartQuestData();

            // Check for new completions
            Object.keys(this.smartQuests).forEach(questType => {
                const quest = this.smartQuests[questType];
                if (!quest) return;

                const wasCompleted = quest.completed;
                const currentProgress = quest.currentProgress || 0;
                const target = quest.target || 0;
                quest.completed = currentProgress >= target;

                // If newly completed, automatically award coins and XP
                if (!wasCompleted && quest.completed && !this.questCompletionStatus[questType]) {
                    console.log(`Smart quest ${questType} newly completed! Auto-awarding rewards.`);

                    // Award coins and XP immediately
                    const xpGained = quest.xpReward || this.getQuestXP(questType);
                    const coinsGained = quest.coinReward || this.getQuestCoins(questType);

                    // DEBUG: Log XP before and after local addition
                    console.log('[DEBUG] Before local XP add:', this.currentUser.exp, 'XP gained:', xpGained);
                    this.currentUser.exp += xpGained;
                    console.log('[DEBUG] After local XP add:', this.currentUser.exp);

                    this.currentUser.coins += coinsGained;

                    // Mark as completed to prevent double rewards
                    this.questCompletionStatus[questType] = true;

                    // Add to activity log
                    const activity = {
                        type: 'smart_quest',
                        questType: questType,
                        date: new Date(),
                        details: `Completed ${quest.questName || questType}`,
                        xpGained: xpGained,
                        coinsGained: coinsGained
                    };

                    this.currentUser.activityLog.unshift(activity);
                    if (this.currentUser.activityLog.length > 50) {
                        this.currentUser.activityLog = this.currentUser.activityLog.slice(0, 50);
                    }

                    // Save states
                    this.saveQuestStates();
                    this.saveUserDataToStorage();

                    // Show notification
                    this.showNotification(
                        `${quest.questName || questType} completed! +${xpGained} XP, +${coinsGained} coins`,
                        'success'
                    );

                    // Add pulsing animation to indicate completion
                    const questItem = document.querySelector(`.smart-quests-section [data-quest="${questType}"]`);
                    if (questItem) {
                        questItem.style.animation = 'pulse 2s infinite';
                    }

                    // Sync with backend
                    this.syncQuestWithBackend(questType, quest);
                }
            });

            await this.updateUI();
        } catch (error) {
            console.error('Data sync failed:', error);
        }
    }

    async refreshSmartQuestData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('No auth token found for smart quest refresh');
                return;
            }

            const decoded = window.jwt_decode(token);
            const email = decoded.email;

            // Refresh smart quest data from backend
            const response = await fetch(`${getApiUrl('/api/getSmartQuestData')}/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const questData = await response.json();
                this.smartQuests = questData.quests;
                console.log('Smart quest data refreshed:', questData);
            } else {
                console.warn('Failed to refresh smart quest data');
            }
        } catch (error) {
            console.error('Error refreshing smart quest data:', error);
        }
    }

    // Public method to refresh dashboard data (can be called from other pages)
    async refreshDashboardData() {
        try {
            console.log('Refreshing dashboard data...');
            // Force refresh user data from backend to ensure we have the latest XP and level
            await this.loadUserData();
            await this.refreshSmartQuestData();
            await this.updateUI();
            // Hide unlocked titles after refresh
            this.hideUnlockedTitles();
            console.log('Dashboard data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    }

    // Manual test function to force update UI


            // Force update UI with direct DOM manipulation

        // Manual refresh function for testing
        async forceRefreshUserData() {
            try {
                console.log('[FORCE REFRESH] Starting manual user data refresh...');
                await this.loadUserData();
                this.updateUI();
                console.log('[FORCE REFRESH] Manual refresh completed');
                console.log('[FORCE REFRESH] Current user data after refresh:', {
                    exp: this.currentUser.exp,
                    level: this.currentUser.level,
                    coins: this.currentUser.coins
                });
            } catch (error) {
                console.error('[FORCE REFRESH] Error during manual refresh:', error);
            }
        }


    // Storage functions
    saveQuestStates() {
        const questData = {
            date: this.todayDate,
            completionStatus: this.questCompletionStatus,
            smartQuests: this.smartQuests
        };
        localStorage.setItem('questStates', JSON.stringify(questData));
    }

    loadQuestStates() {
        try {
            const stored = localStorage.getItem('questStates');
            if (stored) {
                const questData = JSON.parse(stored);

                // Only load if same date
                if (questData.date === this.todayDate) {
                    this.questCompletionStatus = questData.completionStatus || {};

                    // Merge smart quest completion status
                    if (questData.smartQuests) {
                        Object.keys(questData.smartQuests).forEach(questType => {
                            if (this.smartQuests[questType]) {
                                this.smartQuests[questType].completed = questData.smartQuests[questType].completed;
                                this.smartQuests[questType].rewardCollected = questData.smartQuests[questType].rewardCollected || false;
                            }
                        });
                    }
                    
                    // Hide completed quests on page load
                    setTimeout(() => {
                        this.updateRegularQuestUI();
                        this.updateSmartQuestUI();
                    }, 100);
                } else {
                    // New day - reset quest states
                    console.log('New day detected, resetting quest states');
                    this.resetDailyQuests();
                }
            } else {
                // No stored data - initialize for today
                console.log('No stored quest data, initializing for today');
                this.resetDailyQuests();
            }
        } catch (error) {
            console.error('Failed to load quest states:', error);
            this.resetDailyQuests();
        }
    }

    resetDailyQuests() {
        // Reset quest completion status for a new day
        this.questCompletionStatus = {};

        // Reset smart quest completion status and reward collection
        Object.keys(this.smartQuests).forEach(questType => {
            if (this.smartQuests[questType]) {
                this.smartQuests[questType].completed = false;
                this.smartQuests[questType].rewardCollected = false;
                
                // Show the quest again for the new day
                const questItem = document.querySelector(`.smart-quests-section [data-quest="${questType}"]`);
                if (questItem) {
                    console.log(`Showing smart quest ${questType} for new day`);
                    questItem.style.display = 'flex';
                    questItem.classList.remove('quest-completed');
                }
            }
        });

        // Save the reset state
        this.saveQuestStates();

        console.log('Daily quests and smart quests reset for new day');
    }

    // syncQuestCompletionFromBackend removed - dailyQuests no longer used

    saveUserDataToStorage() {
        try {
            // Get existing user data to preserve titles and other important fields
            const existingUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            const userData = {
                ...existingUserData, // Preserve existing data including titles
                profileName: this.currentUser.profileName,
                level: this.currentUser.level,
                exp: this.currentUser.exp,
                coins: this.currentUser.coins,
                avatar: this.currentUser.avatar,
                // Ensure titles are preserved
                titles: this.currentUser.titles || existingUserData.titles || [],
                selectedTitle: this.currentUser.selectedTitle || existingUserData.selectedTitle,
                // Preserve other important fields
                email: this.currentUser.email || existingUserData.email,
                activityLog: this.currentUser.activityLog || existingUserData.activityLog || [],
                questStats: this.currentUser.questStats || existingUserData.questStats || {}
            };
            localStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }

    // Helper functions
    calculateLevel(xp) {
        if (xp < 100) return 1;
        if (xp < 300) return 2;
        if (xp < 600) return 3;
        if (xp < 1000) return 4;
        if (xp < 1500) return 5;
        if (xp < 2100) return 6;
        if (xp < 2800) return 7;
        if (xp < 3600) return 8;
        if (xp < 4500) return 9;
        return Math.floor((xp - 4500) / 1000) + 10;
    }

    getXPForLevel(level) {
        const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
        if (level <= 9) return thresholds[level];
        return 4500 + (level - 9) * 1000;
    }

    getQuestXP(questType) {
        const xpRewards = {
            'steps': 50,
            'calories': 30,
            'protein': 25,
            'water': 20,
            'sleep': 35,
            'exercise': 40,
            'meal': 20
        };
        return xpRewards[questType] || 15;
    }

    getQuestCoins(questType) {
        const coinRewards = {
            'steps': 15,
            'calories': 10,
            'protein': 8,
            'water': 5,
            'sleep': 12,
            'exercise': 18,
            'meal': 5
        };
        return coinRewards[questType] || 3;
    }

    calculateRank(xp) {
        // Simple rank calculation based on XP ranges
        // You can replace this with actual ranking logic from your backend
        if (xp >= 5000) return 1;
        if (xp >= 3000) return 2;
        if (xp >= 2000) return 3;
        if (xp >= 1500) return 4;
        if (xp >= 1000) return 5;
        if (xp >= 500) return 10;
        if (xp >= 200) return 20;
        if (xp >= 100) return 30;
        return 50;
    }

    async getRealRank(email) {
        console.log('🔍 Getting real rank for email:', email);
        try {
            const response = await fetch(getApiUrl(`/api/rank/${encodeURIComponent(email)}`));
            console.log('🔍 Rank API response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to fetch rank');
            }
            const data = await response.json();
            console.log('🔍 Rank API response data:', data);
            return data.rank;
        } catch (error) {
            console.error('❌ Error fetching real rank:', error);
            // Fallback to calculated rank
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            const fallbackRank = this.calculateRank(userData.xp || 0);
            console.log('🔍 Using fallback rank:', fallbackRank);
            return fallbackRank;
        }
    }

    getActivityIcon(type, questType = null) {
        if (type === 'quest' && questType) {
            const questIcons = {
                'steps': '👣',
                'calories': '🔥',
                'protein': '💪',
                'water': '💧',
                'sleep': '😴',
                'exercise': '🏋️',
                'meal': '🍽️'
            };
            return questIcons[questType] || '🎯';
        }

        const icons = {
            'quest': '🎯',
            'levelup': '⭐',
            'badge': '🏅',
            'title': '🏆',
            'challenge': '🎮',
            'purchase': '🛒'
        };
        return icons[type] || '🎮';
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            font-weight: 500;
            font-size: 14px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showLevelUpNotification(newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px;">🎉</div>
                <h2 style="color: #FFD700; margin: 10px 0;">LEVEL UP!</h2>
                <p style="color: white; font-size: 18px;">You've reached Level ${newLevel}!</p>
                <p style="color: #ccc; font-size: 14px;">New rewards unlocked!</p>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 1001;
            animation: levelUpPulse 0.6s ease;
            font-family: 'Inter', sans-serif;
        `;

        document.body.appendChild(notification);

        // Share level up with friends
        this.shareLevelUpWithFriends(newLevel);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    async shareLevelUpWithFriends(newLevel) {
        try {
            const userData = JSON.parse(localStorage.getItem('userData')) || JSON.parse(localStorage.getItem('currentUser'));
            if (!userData || !userData.email) return;

            const response = await fetch(getApiUrl('/api/activities/share-levelup'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userEmail: userData.email,
                    newLevel: newLevel,
                    xpGained: 0 // You can calculate this if needed
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Level up shared with friends:', result);
            }
        } catch (error) {
            console.error('Error sharing level up with friends:', error);
        }
    }

    showUnlockModal(cost, type, onConfirm) {
        console.log('showUnlockModal called:', { cost, type });
        
        // Remove existing modal
        const existingModal = document.getElementById('unlock-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = this.createUnlockModal(cost, type, onConfirm);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        console.log('Unlock modal displayed');
    }

    createUnlockModal(cost, type, onConfirm) {
        const modal = document.createElement('div');
        modal.id = 'unlock-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Unlock ${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                    <span class="close" id="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <p>This will cost <strong>${cost} coins</strong>.</p>
                    <p>Current balance: <strong>${this.currentUser.coins} coins</strong></p>
                    ${this.currentUser.coins < cost ? '<p style="color: #f44336;">⚠️ Insufficient coins!</p>' : ''}
                </div>
                <div class="modal-footer">
                    <button id="cancel-unlock" class="btn btn-secondary">Cancel</button>
                    <button id="confirm-unlock" class="btn btn-primary" ${this.currentUser.coins < cost ? 'disabled' : ''}>
                        ${this.currentUser.coins < cost ? 'Not enough coins' : 'Unlock'}
                    </button>
                </div>
            </div>
        `;

        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            align-items: center;
            justify-content: center;
        `;

        // Event listeners
        const closeBtn = modal.querySelector('#close-modal');
        const cancelBtn = modal.querySelector('#cancel-unlock');
        const confirmBtn = modal.querySelector('#confirm-unlock');

        const closeModal = () => {
            modal.style.display = 'none';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 200);
        };

        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;

        confirmBtn.onclick = () => {
            console.log('Confirm unlock button clicked');
            if (this.currentUser.coins >= cost) {
                console.log('Calling onConfirm callback');
                onConfirm();
                closeModal();
            } else {
                this.showNotification('Not enough coins!', 'error');
            }
        };

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        // Close on escape key
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });

        return modal;
    }

    // --- Minimal Stats UI Update Function ---
    async updateStatsUI() {
        // Coin balance
        const coinBalance = document.querySelector('.coin-balance');
        if (coinBalance) coinBalance.textContent = this.currentUser.coins || 0;

        // Always calculate level from XP
        const currentXP = this.currentUser.exp || 0;
        const currentLevel = this.calculateLevel(currentXP);
        const currentLevelXP = this.getXPForLevel(currentLevel - 1);
        const nextLevelXP = this.getXPForLevel(currentLevel);
        const progressXP = currentXP - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const progressPercent = Math.min((progressXP / neededXP) * 100, 100);

        // Debug log for calculation
        console.log('[STATS DEBUG]', {
            currentLevel,
            currentXP,
            currentLevelXP,
            nextLevelXP,
            progressXP,
            neededXP,
            progressPercent
        });

        const currentLevelEl = document.querySelector('.current-level');
        if (currentLevelEl) currentLevelEl.textContent = `Level ${currentLevel}`;

        const xpDisplay = document.querySelector('.xp');
        if (xpDisplay) xpDisplay.textContent = `${progressXP}/${neededXP} XP`;

        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) progressFill.style.width = `${progressPercent}%`;

        // Stats section
        const levelStatValue = document.querySelector('[data-stat="level"]');
        if (levelStatValue) levelStatValue.textContent = currentLevel;

        const xpStatValue = document.querySelector('[data-stat="xp"]');
        if (xpStatValue) xpStatValue.textContent = currentXP;

        const rankStatValue = document.querySelector('[data-stat="rank"]');
        if (rankStatValue) {
            // Show loading state first
            rankStatValue.textContent = '...';
            
            // Get real rank from backend (async, but don't await here)
            this.getRealRank(this.currentUser.email).then(realRank => {
                rankStatValue.textContent = `#${realRank}`;
                console.log('✅ Real rank updated in stats:', `#${realRank}`);
            }).catch(error => {
                // Fallback to calculated rank
                const fallbackRank = this.calculateRank(currentXP);
                rankStatValue.textContent = `#${fallbackRank}`;
                console.log('✅ Fallback rank updated in stats:', `#${fallbackRank}`);
            });
        }

        const streakStatValue = document.querySelector('[data-stat="streak"]');
        if (streakStatValue) streakStatValue.textContent = this.currentUser.questStats?.currentStreak || 0;

        const proteinStreakStatValue = document.querySelector('[data-stat="protein-streak"]');
        if (proteinStreakStatValue) proteinStreakStatValue.textContent = this.currentUser.questStats?.proteinStreak || 0;

        const calorieStreakStatValue = document.querySelector('[data-stat="calorie-streak"]');
        if (calorieStreakStatValue) calorieStreakStatValue.textContent = this.currentUser.questStats?.calorieStreak || 0;
    }
}

// Enhanced CSS Styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes levelUpPulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    .quest-completed {
        opacity: 0.9;
        background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
        border-left: 4px solid #4CAF50;
        transform: scale(0.98);
        transition: all 0.3s ease;
    }
    
    .quest-item.quest-completed .progress-fill {
        background: linear-gradient(90deg, #4CAF50, #45a049) !important;
    }
    
    .checklist-item.quest-completed {
        background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
        border-left: 4px solid #4CAF50;
    }
    
    .checklist-item.quest-completed .quest-checkbox {
        accent-color: #4CAF50;
    }
    
    .notification {
        font-weight: 500;
        font-size: 14px;
    }
    
    .level-up-notification {
        font-family: 'Inter', sans-serif;
    }
    
    .modal-content {
        background: white;
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        max-width: 400px;
        width: 90%;
        overflow: hidden;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 20px 15px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #333;
        font-size: 18px;
        font-weight: 600;
    }
    
    .close {
        font-size: 24px;
        cursor: pointer;
        color: #999;
        line-height: 1;
        padding: 0;
        background: none;
        border: none;
    }
    
    .close:hover {
        color: #333;
    }
    
    .modal-body {
        padding: 20px;
        color: #666;
        line-height: 1.5;
    }
    
    .modal-body p {
        margin: 0 0 10px 0;
    }
    
    .modal-body p:last-child {
        margin-bottom: 0;
    }
    
    .modal-footer {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding: 15px 20px 20px;
        background: #f8f9fa;
    }
    
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s ease;
    }
    
    .btn-primary {
        background: #007bff;
        color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
        background: #0056b3;
    }
    
    .btn-secondary {
        background: #6c757d;
        color: white;
    }
    
    .btn-secondary:hover {
        background: #545b62;
    }
    
    .btn-success {
        background: #28a745;
        color: white;
    }
    
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: #ccc !important;
    }
    
    .activity-xp {
        color: #4CAF50;
        font-weight: bold;
        margin-right: 8px;
    }
    
    .activity-coins {
        color: #FF9800;
        font-weight: bold;
        margin-right: 8px;
    }
    
    .scaling-notice {
        color: #FF9800;
        font-size: 12px;
        font-weight: 500;
        margin-top: 4px;
        display: none;
    }
    
    /* Quest item hover effects */
    .quest-item:not(.quest-completed) {
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .quest-item:not(.quest-completed):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .checklist-item:not(.quest-completed) {
        transition: all 0.2s ease;
    }
    
    .checklist-item:not(.quest-completed):hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    /* Progress bar animations */
    .progress-fill {
        transition: width 0.5s ease, background 0.3s ease;
    }
    
    /* Summary card click effect */
    .summary-card[title]:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
    }
    
    /* Loading states */
    .loading {
        opacity: 0.7;
        pointer-events: none;
    }
    
    .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Dark mode support */
    .dark-mode .modal-content {
        background: #2d3748;
        color: white;
    }
    
    .dark-mode .modal-header {
        background: #4a5568;
        border-bottom-color: #4a5568;
    }
    
    .dark-mode .modal-footer {
        background: #4a5568;
    }
    
    .dark-mode .modal-header h3 {
        color: white;
    }
    
    .dark-mode .modal-body {
        color: #e2e8f0;
    }
`;
document.head.appendChild(style);

// Auth Check
(function () {
    console.log('[AUTH CHECK] Starting auth validation...');
    
    const redirectToLogin = () => {
        console.log('[AUTH CHECK] Redirecting to login...');
        window.location.href = '/Login/login.html';
    };

    const token = localStorage.getItem('authToken');
    console.log('[AUTH CHECK] Token found:', !!token);
    
    if (!token) {
        console.log('[AUTH CHECK] No token found, redirecting...');
        redirectToLogin();
        return;
    }

    try {
        const decoded = window.jwt_decode ? window.jwt_decode(token) : null;
        console.log('[AUTH CHECK] Token decoded:', !!decoded);
        
        if (!decoded || !decoded.exp) {
            console.log('[AUTH CHECK] Invalid token structure, redirecting...');
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        console.log('[AUTH CHECK] Token expires:', new Date(decoded.exp * 1000));
        console.log('[AUTH CHECK] Current time:', new Date(now * 1000));
        
        if (decoded.exp < now) {
            console.log('[AUTH CHECK] Token expired, redirecting...');
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        
        console.log('[AUTH CHECK] Auth validation passed!');
    } catch (e) {
        console.error('[AUTH CHECK] Token validation error:', e);
        localStorage.removeItem('authToken');
        redirectToLogin();
    }
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        window.enhancedDashboard = new EnhancedDashboardGamification();
        // Also create a global dashboard variable for easier access
        window.dashboard = window.enhancedDashboard;
    }, 100);
});

// At the end of the file, after the class definition and DOMContentLoaded
// Explicitly declare every method on the prototype for debugging/clarity
EnhancedDashboardGamification.prototype.init = EnhancedDashboardGamification.prototype.init;
EnhancedDashboardGamification.prototype.loadUserData = EnhancedDashboardGamification.prototype.loadUserData;
EnhancedDashboardGamification.prototype.loadSmartQuestData = EnhancedDashboardGamification.prototype.loadSmartQuestData;
EnhancedDashboardGamification.prototype.initializeDefaultQuests = EnhancedDashboardGamification.prototype.initializeDefaultQuests;
EnhancedDashboardGamification.prototype.initializeQuests = EnhancedDashboardGamification.prototype.initializeQuests;
EnhancedDashboardGamification.prototype.calculateStepGoal = EnhancedDashboardGamification.prototype.calculateStepGoal;
EnhancedDashboardGamification.prototype.calculateCalorieGoal = EnhancedDashboardGamification.prototype.calculateCalorieGoal;
EnhancedDashboardGamification.prototype.calculateProteinGoal = EnhancedDashboardGamification.prototype.calculateProteinGoal;
EnhancedDashboardGamification.prototype.getTodaySteps = EnhancedDashboardGamification.prototype.getTodaySteps;
EnhancedDashboardGamification.prototype.getTodayCalories = EnhancedDashboardGamification.prototype.getTodayCalories;
EnhancedDashboardGamification.prototype.getTodayProtein = EnhancedDashboardGamification.prototype.getTodayProtein;
EnhancedDashboardGamification.prototype.setupEventListeners = EnhancedDashboardGamification.prototype.setupEventListeners;
EnhancedDashboardGamification.prototype.setupStepInput = EnhancedDashboardGamification.prototype.setupStepInput;
EnhancedDashboardGamification.prototype.updateSteps = EnhancedDashboardGamification.prototype.updateSteps;
EnhancedDashboardGamification.prototype.handleSmartQuestClick = EnhancedDashboardGamification.prototype.handleSmartQuestClick;
EnhancedDashboardGamification.prototype.handleRegularQuestToggle = EnhancedDashboardGamification.prototype.handleRegularQuestToggle;
EnhancedDashboardGamification.prototype.completeQuest = EnhancedDashboardGamification.prototype.completeQuest;
EnhancedDashboardGamification.prototype.syncQuestWithBackend = EnhancedDashboardGamification.prototype.syncQuestWithBackend;
EnhancedDashboardGamification.prototype.syncUserDataToBackend = EnhancedDashboardGamification.prototype.syncUserDataToBackend;
EnhancedDashboardGamification.prototype.getRegularQuestData = EnhancedDashboardGamification.prototype.getRegularQuestData;
EnhancedDashboardGamification.prototype.updateQuestStats = EnhancedDashboardGamification.prototype.updateQuestStats;
EnhancedDashboardGamification.prototype.unlockChallenge = EnhancedDashboardGamification.prototype.unlockChallenge;
EnhancedDashboardGamification.prototype.unlockTitle = EnhancedDashboardGamification.prototype.unlockTitle;

EnhancedDashboardGamification.prototype.getTitleName = EnhancedDashboardGamification.prototype.getTitleName;
EnhancedDashboardGamification.prototype.updateUI = EnhancedDashboardGamification.prototype.updateUI;
EnhancedDashboardGamification.prototype.updateSmartQuestUI = EnhancedDashboardGamification.prototype.updateSmartQuestUI;
EnhancedDashboardGamification.prototype.collectSmartQuestReward = EnhancedDashboardGamification.prototype.collectSmartQuestReward;
EnhancedDashboardGamification.prototype.updateRegularQuestUI = EnhancedDashboardGamification.prototype.updateRegularQuestUI;
EnhancedDashboardGamification.prototype.updateTitleUI = EnhancedDashboardGamification.prototype.updateTitleUI;
EnhancedDashboardGamification.prototype.hideUnlockedTitles = EnhancedDashboardGamification.prototype.hideUnlockedTitles;
EnhancedDashboardGamification.prototype.updateActivityList = EnhancedDashboardGamification.prototype.updateActivityList;
EnhancedDashboardGamification.prototype.startDataSync = EnhancedDashboardGamification.prototype.startDataSync;
EnhancedDashboardGamification.prototype.syncFoodLogData = EnhancedDashboardGamification.prototype.syncFoodLogData;
EnhancedDashboardGamification.prototype.refreshSmartQuestData = EnhancedDashboardGamification.prototype.refreshSmartQuestData;
EnhancedDashboardGamification.prototype.refreshDashboardData = EnhancedDashboardGamification.prototype.refreshDashboardData;
EnhancedDashboardGamification.prototype.forceRefreshUserData = EnhancedDashboardGamification.prototype.forceRefreshUserData;
EnhancedDashboardGamification.prototype.saveQuestStates = EnhancedDashboardGamification.prototype.saveQuestStates;
EnhancedDashboardGamification.prototype.loadQuestStates = EnhancedDashboardGamification.prototype.loadQuestStates;
EnhancedDashboardGamification.prototype.resetDailyQuests = EnhancedDashboardGamification.prototype.resetDailyQuests;
EnhancedDashboardGamification.prototype.saveUserDataToStorage = EnhancedDashboardGamification.prototype.saveUserDataToStorage;
EnhancedDashboardGamification.prototype.calculateLevel = EnhancedDashboardGamification.prototype.calculateLevel;
EnhancedDashboardGamification.prototype.getXPForLevel = EnhancedDashboardGamification.prototype.getXPForLevel;
EnhancedDashboardGamification.prototype.getQuestXP = EnhancedDashboardGamification.prototype.getQuestXP;
EnhancedDashboardGamification.prototype.getQuestCoins = EnhancedDashboardGamification.prototype.getQuestCoins;
EnhancedDashboardGamification.prototype.calculateRank = EnhancedDashboardGamification.prototype.calculateRank;
EnhancedDashboardGamification.prototype.getActivityIcon = EnhancedDashboardGamification.prototype.getActivityIcon;
EnhancedDashboardGamification.prototype.showNotification = EnhancedDashboardGamification.prototype.showNotification;
EnhancedDashboardGamification.prototype.showLevelUpNotification = EnhancedDashboardGamification.prototype.showLevelUpNotification;
EnhancedDashboardGamification.prototype.showUnlockModal = EnhancedDashboardGamification.prototype.showUnlockModal;
EnhancedDashboardGamification.prototype.createUnlockModal = EnhancedDashboardGamification.prototype.createUnlockModal;
EnhancedDashboardGamification.prototype.updateStatsUI = EnhancedDashboardGamification.prototype.updateStatsUI;

// Global functions for testing
window.testRefreshUserData = () => {
    if (dashboardInstance) {
        dashboardInstance.forceRefreshUserData();
    } else {
        console.error('Dashboard instance not available');
    }
};

window.logUserData = () => {
    if (dashboardInstance && dashboardInstance.currentUser) {
        console.log('Current user data:', {
            exp: dashboardInstance.currentUser.exp,
            level: dashboardInstance.currentUser.level,
            coins: dashboardInstance.currentUser.coins
        });
    } else {
        console.error('Dashboard instance or user data not available');
    }
};

window.testXPLevelSync = () => {
    if (dashboardInstance && dashboardInstance.currentUser) {
        const calculatedLevel = dashboardInstance.calculateLevel(dashboardInstance.currentUser.exp);
        console.log('XP/Level Sync Test:', {
            currentXP: dashboardInstance.currentUser.exp,
            currentLevel: dashboardInstance.currentUser.level,
            calculatedLevel: calculatedLevel,
            isConsistent: dashboardInstance.currentUser.level === calculatedLevel
        });
        
        if (dashboardInstance.currentUser.level !== calculatedLevel) {
            console.warn('⚠️ Level inconsistency detected!');
        } else {
            console.log('✅ XP and level are consistent');
        }
    } else {
        console.error('Dashboard instance or user data not available');
    }
};