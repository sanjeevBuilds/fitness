// Enhanced Dashboard Gamification Class - Fixed Version
class EnhancedDashboardGamification {
    constructor() {
        this.currentUser = null;
        this.smartQuests = {};
        this.availableBadges = [];
        this.availableTitles = [];
        this.activityLog = [];
        
        // API Base URL
        this.API_BASE = 'http://localhost:8000/api';
        
        // DOM Elements
        this.coinBalance = document.querySelector('.coin-balance');
        this.currentLevelEl = document.querySelector('.current-level');
        this.xpDisplay = document.querySelector('.xp');
        this.progressFill = document.querySelector('.progress-fill');
        this.levelStatValue = document.querySelector('[data-stat="level"]');
        this.xpStatValue = document.querySelector('[data-stat="xp"]');
        this.activityList = document.getElementById('activity-list');
        this.smartQuestsSection = document.querySelector('.smart-quests-section');

        // Quest data for today
        this.todayDate = new Date().toISOString().slice(0, 10);
        this.questCompletionStatus = {};

        this.init();
    }

    async init() {
        try {
            await this.loadUserData();
            this.initializeQuests();
            this.setupEventListeners();
            this.updateUI();
            this.loadQuestStates();
            this.startDataSync();
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No auth token');

            const decoded = window.jwt_decode(token);
            const email = decoded.email;
            
            const response = await fetch(`${this.API_BASE}/getUser/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.currentUser = await response.json();
            
            // Initialize defaults if missing
            this.currentUser.exp = this.currentUser.exp || 0;
            this.currentUser.coins = this.currentUser.coins || 0;
            this.currentUser.level = this.currentUser.level || 1;
            this.currentUser.badges = this.currentUser.badges || [];
            this.currentUser.titles = this.currentUser.titles || [];
            this.currentUser.activityLog = this.currentUser.activityLog || [];
            this.currentUser.dailyQuests = this.currentUser.dailyQuests || [];
            this.currentUser.questStats = this.currentUser.questStats || {
                totalQuestsCompleted: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastQuestDate: null,
                stepGoalHistory: []
            };

            console.log('User data loaded:', this.currentUser);
            
        } catch (error) {
            console.error('Error loading user data:', error);
            throw error;
        }
    }

    initializeQuests() {
        // Initialize smart quests based on user data and food logs
        this.smartQuests = {
            steps: {
                questType: 'steps',
                questName: 'Daily Steps',
                target: this.calculateStepGoal(),
                currentProgress: this.getTodaySteps(),
                completed: false,
                xpReward: 50,
                coinReward: 15
            },
            calories: {
                questType: 'calories',
                questName: 'Calorie Goal',
                target: this.calculateCalorieGoal(),
                currentProgress: this.getTodayCalories(),
                completed: false,
                xpReward: 30,
                coinReward: 10
            },
            protein: {
                questType: 'protein',
                questName: 'Protein Target',
                target: this.calculateProteinGoal(),
                currentProgress: this.getTodayProtein(),
                completed: false,
                xpReward: 25,
                coinReward: 8
            },
            water: {
                questType: 'water',
                questName: 'Hydration Goal',
                target: this.currentUser.waterIntake || 2,
                currentProgress: 0,
                completed: false,
                xpReward: 20,
                coinReward: 5
            }
        };

        // Check completion status
        Object.keys(this.smartQuests).forEach(questType => {
            const quest = this.smartQuests[questType];
            quest.completed = quest.currentProgress >= quest.target;
        });
    }

    calculateStepGoal() {
        const history = this.currentUser.questStats?.stepGoalHistory || [];
        const recent = history.slice(-7); // Last 7 days
        
        if (recent.length === 0) return 5000; // Default
        
        const avgAchieved = recent.reduce((sum, day) => sum + day.achieved, 0) / recent.length;
        return Math.max(Math.round(avgAchieved * 1.05), 5000); // 5% increase
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

    getTodaySteps() {
        // This would normally come from a fitness tracker API or manual input
        // For now, return from localStorage or default
        const stored = localStorage.getItem(`steps_${this.todayDate}`);
        return stored ? parseInt(stored) : 0;
    }

    getTodayCalories() {
        const todayLog = this.currentUser.foodLogs?.find(log => log.date === this.todayDate);
        return todayLog ? todayLog.calories || 0 : 0;
    }

    getTodayProtein() {
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

        // Challenge unlock buttons
        document.querySelectorAll('.unlock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cost = parseInt(e.target.dataset.cost);
                const challengeCard = e.target.closest('.challenge-card');
                const challengeType = challengeCard.dataset.challenge;
                this.showUnlockModal(cost, 'challenge', () => {
                    this.unlockChallenge(challengeCard, challengeType, cost);
                });
            });
        });

        // Title unlock buttons
        document.querySelectorAll('.unlock-title-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cost = parseInt(e.target.dataset.cost);
                const titleCard = e.target.closest('.title-card');
                const titleId = titleCard.dataset.title;
                this.showUnlockModal(cost, 'title', () => {
                    this.unlockTitle(titleId, cost);
                });
            });
        });

        // Manual step input
        this.setupStepInput();
    }

    setupStepInput() {
        const stepsCard = document.querySelector('.summary-card:nth-child(3)'); // Steps card
        if (stepsCard) {
            stepsCard.addEventListener('click', () => {
                const currentSteps = this.getTodaySteps();
                const newSteps = prompt(`Enter your current step count for today:\nCurrent: ${currentSteps.toLocaleString()}`, currentSteps);
                
                if (newSteps !== null && !isNaN(newSteps) && parseInt(newSteps) >= 0) {
                    this.updateSteps(parseInt(newSteps));
                }
            });
            stepsCard.style.cursor = 'pointer';
            stepsCard.title = 'Click to update step count';
        }
    }

    updateSteps(steps) {
        localStorage.setItem(`steps_${this.todayDate}`, steps.toString());
        this.smartQuests.steps.currentProgress = steps;
        this.smartQuests.steps.completed = steps >= this.smartQuests.steps.target;
        
        // Update display
        const stepsDisplay = document.getElementById('steps-display');
        if (stepsDisplay) {
            stepsDisplay.textContent = steps.toLocaleString();
        }
        
        this.updateSmartQuestUI();
        
        // Check if quest completed
        if (this.smartQuests.steps.completed && !this.questCompletionStatus.steps) {
            this.completeQuest('steps');
        }
        
        this.showNotification(`Steps updated: ${steps.toLocaleString()}`, 'success');
    }

    async handleSmartQuestClick(questType) {
        const quest = this.smartQuests[questType];
        if (!quest) return;

        if (questType === 'steps') {
            const newSteps = prompt(`Current steps: ${quest.currentProgress.toLocaleString()}\nEnter new step count:`, quest.currentProgress);
            if (newSteps && !isNaN(newSteps) && parseInt(newSteps) >= 0) {
                this.updateSteps(parseInt(newSteps));
            }
        } else {
            // Show current progress
            this.showNotification(
                `${quest.questName}: ${quest.currentProgress}/${quest.target} (${Math.round((quest.currentProgress/quest.target)*100)}%)`,
                'info'
            );
        }
    }

    async handleRegularQuestToggle(questType, isCompleted) {
        if (isCompleted) {
            await this.completeQuest(questType, true);
        } else {
            // Uncheck - remove completion status
            this.questCompletionStatus[questType] = false;
            this.saveQuestStates();
        }
    }

    async completeQuest(questType, isRegularQuest = false) {
        try {
            // Prevent double completion
            if (this.questCompletionStatus[questType]) {
                return;
            }

            const quest = isRegularQuest ? this.getRegularQuestData(questType) : this.smartQuests[questType];
            if (!quest) return;

            const xpGained = quest.xpReward || this.getQuestXP(questType);
            const coinsGained = quest.coinReward || this.getQuestCoins(questType);

            // Update user stats locally
            this.currentUser.exp += xpGained;
            this.currentUser.coins += coinsGained;
            
            // Check for level up
            const oldLevel = this.currentUser.level;
            this.currentUser.level = this.calculateLevel(this.currentUser.exp);
            const leveledUp = this.currentUser.level > oldLevel;

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

            // Show notifications
            this.showNotification(
                `Quest completed! +${xpGained} XP, +${coinsGained} coins`, 
                'success'
            );

            if (leveledUp) {
                this.showLevelUpNotification(this.currentUser.level);
            }

            // Try to sync with backend (non-blocking)
            this.syncQuestWithBackend(questType, quest);

        } catch (error) {
            console.error('Error completing quest:', error);
            this.showNotification('Failed to complete quest', 'error');
        }
    }

    async syncQuestWithBackend(questType, quest) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.API_BASE}/updateQuest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    questType: questType,
                    completed: true,
                    progress: quest.currentProgress,
                    xpGained: quest.xpReward,
                    coinsGained: quest.coinReward
                })
            });

            if (response.ok) {
                console.log('Quest synced with backend successfully');
            } else {
                console.warn('Failed to sync quest with backend:', response.statusText);
            }
        } catch (error) {
            console.warn('Backend sync failed:', error);
            // Continue working offline
        }
    }

    getRegularQuestData(questType) {
        const questData = {
            water: { questName: 'Hydration Master', xpReward: 25, coinReward: 5 },
            steps: { questName: 'Step Champion', xpReward: 50, coinReward: 15 },
            sleep: { questName: 'Sleep Warrior', xpReward: 30, coinReward: 8 },
            posture: { questName: 'Posture Pro', xpReward: 40, coinReward: 10 },
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
                stepGoalHistory: []
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

    async unlockChallenge(challengeCard, challengeType, cost) {
        if (this.currentUser.coins < cost) {
            this.showNotification('Not enough coins!', 'error');
            return;
        }

        // Deduct coins
        this.currentUser.coins -= cost;
        
        // Update UI
        challengeCard.classList.add('unlocked');
        const unlockBtn = challengeCard.querySelector('.unlock-btn');
        if (unlockBtn) {
            unlockBtn.textContent = 'Challenge Active';
            unlockBtn.disabled = true;
            unlockBtn.classList.remove('btn-primary');
            unlockBtn.classList.add('btn-success');
        }
        
        // Add to activity log
        const activity = {
            type: 'challenge',
            date: new Date(),
            details: `Unlocked ${challengeType} challenge`,
            coinsSpent: cost
        };
        this.currentUser.activityLog.unshift(activity);
        
        this.saveUserDataToStorage();
        this.updateUI();
        this.showNotification(`Challenge unlocked! -${cost} coins`, 'success');
    }

    async unlockTitle(titleId, cost) {
        if (this.currentUser.coins < cost) {
            this.showNotification('Not enough coins!', 'error');
            return;
        }

        // Deduct coins
        this.currentUser.coins -= cost;
        
        // Add title
        const newTitle = {
            titleId: titleId,
            title: this.getTitleName(titleId),
            unlockedAt: new Date()
        };
        this.currentUser.titles.push(newTitle);
        
        // Update UI
        this.updateTitleUI(titleId);
        
        // Add to activity log
        const activity = {
            type: 'title',
            date: new Date(),
            details: `Unlocked title: ${newTitle.title}`,
            coinsSpent: cost
        };
        this.currentUser.activityLog.unshift(activity);
        
        this.saveUserDataToStorage();
        this.updateUI();
        this.showNotification(`Title unlocked! -${cost} coins`, 'success');
    }

    getTitleName(titleId) {
        const titles = {
            'step-warrior': 'Step Warrior',
            'protein-beast': 'Protein Beast',
            'streak-legend': 'Streak Legend'
        };
        return titles[titleId] || titleId;
    }

    updateUI() {
        // Update coin balance
        if (this.coinBalance) {
            this.coinBalance.textContent = this.currentUser.coins || 0;
        }

        // Update level and XP
        const currentLevel = this.currentUser.level;
        const currentXP = this.currentUser.exp;
        const currentLevelXP = this.getXPForLevel(currentLevel - 1);
        const nextLevelXP = this.getXPForLevel(currentLevel);
        const progressXP = currentXP - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const progressPercent = Math.min((progressXP / neededXP) * 100, 100);

        if (this.currentLevelEl) {
            this.currentLevelEl.textContent = `Level ${currentLevel}`;
        }

        if (this.xpDisplay) {
            this.xpDisplay.textContent = `${progressXP}/${neededXP} XP`;
        }

        if (this.progressFill) {
            this.progressFill.style.width = `${progressPercent}%`;
        }

        if (this.levelStatValue) {
            this.levelStatValue.textContent = currentLevel;
        }

        if (this.xpStatValue) {
            this.xpStatValue.textContent = currentXP;
        }

        // Update summary cards
        this.updateSummaryCards();

        // Update smart quests UI
        this.updateSmartQuestUI();

        // Update activity list
        this.updateActivityList();

        // Update quest checkboxes
        this.updateRegularQuestUI();
    }

    updateSummaryCards() {
        // Update summary displays
        const caloriesDisplay = document.getElementById('calories-display');
        const proteinDisplay = document.getElementById('protein-display');
        const stepsDisplay = document.getElementById('steps-display');
        
        if (caloriesDisplay) caloriesDisplay.textContent = this.getTodayCalories();
        if (proteinDisplay) proteinDisplay.textContent = this.getTodayProtein();
        if (stepsDisplay) stepsDisplay.textContent = this.getTodaySteps().toLocaleString();
    }

    updateSmartQuestUI() {
        Object.keys(this.smartQuests).forEach(questType => {
            const quest = this.smartQuests[questType];
            const questItem = document.querySelector(`.smart-quests-section [data-quest="${questType}"]`);
            
            if (questItem) {
                const goalEl = questItem.querySelector('.current-goal');
                const progressFill = questItem.querySelector('.progress-fill');
                const progressText = questItem.querySelector('.progress-text');
                const rewardXp = questItem.querySelector('.reward-xp');
                const rewardCoins = questItem.querySelector('.reward-coins');
                const scalingNotice = questItem.querySelector('.scaling-notice');

                if (goalEl) goalEl.textContent = quest.target.toLocaleString();
                if (progressText) {
                    progressText.textContent = `${quest.currentProgress.toLocaleString()} / ${quest.target.toLocaleString()}`;
                }
                
                if (progressFill) {
                    const progressPercent = Math.min((quest.currentProgress / quest.target) * 100, 120);
                    progressFill.style.width = `${progressPercent}%`;
                    
                    // Change color based on completion
                    if (quest.completed) {
                        progressFill.style.background = 'linear-gradient(90deg, #4CAF50, #45a049)';
                    } else if (progressPercent > 100) {
                        progressFill.style.background = 'linear-gradient(90deg, #FF9800, #F57C00)';
                    } else {
                        progressFill.style.background = 'linear-gradient(90deg, #2196F3, #1976D2)';
                    }
                }

                if (rewardXp) rewardXp.textContent = `+${quest.xpReward} XP`;
                if (rewardCoins) rewardCoins.textContent = `+${quest.coinReward} Coins`;
                
                // Add completion styling
                if (quest.completed) {
                    questItem.classList.add('quest-completed');
                } else {
                    questItem.classList.remove('quest-completed');
                }
            }
        });
    }

    updateRegularQuestUI() {
        Object.keys(this.questCompletionStatus).forEach(questType => {
            const checkbox = document.getElementById(`${questType}-quest`);
            if (checkbox) {
                checkbox.checked = this.questCompletionStatus[questType] || false;
                
                // Disable if completed
                checkbox.disabled = this.questCompletionStatus[questType];
                
                // Update parent styling
                const questItem = checkbox.closest('.checklist-item');
                if (questItem) {
                    if (this.questCompletionStatus[questType]) {
                        questItem.classList.add('quest-completed');
                    } else {
                        questItem.classList.remove('quest-completed');
                    }
                }
            }
        });
    }

    updateTitleUI(titleId) {
        const titleCard = document.querySelector(`[data-title="${titleId}"]`);
        if (titleCard) {
            titleCard.classList.add('unlocked');
            const unlockBtn = titleCard.querySelector('.unlock-title-btn');
            if (unlockBtn) {
                unlockBtn.textContent = 'Unlocked';
                unlockBtn.disabled = true;
                unlockBtn.classList.remove('btn-secondary');
                unlockBtn.classList.add('btn-success');
            }
        }
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
            await this.loadUserData();
            
            // Update smart quests based on new food log data
            this.smartQuests.calories.currentProgress = this.getTodayCalories();
            this.smartQuests.protein.currentProgress = this.getTodayProtein();
            
            // Check for new completions
            Object.keys(this.smartQuests).forEach(questType => {
                const quest = this.smartQuests[questType];
                const wasCompleted = quest.completed;
                quest.completed = quest.currentProgress >= quest.target;
                
                // If newly completed, trigger completion
                if (!wasCompleted && quest.completed && !this.questCompletionStatus[questType]) {
                    this.completeQuest(questType);
                }
            });
            
            this.updateUI();
        } catch (error) {
            console.error('Data sync failed:', error);
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
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load quest states:', error);
        }
    }

    saveUserDataToStorage() {
        try {
            const userData = {
                profileName: this.currentUser.profileName,
                level: this.currentUser.level,
                exp: this.currentUser.exp,
                coins: this.currentUser.coins,
                avatar: this.currentUser.avatar
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
            'posture': 30,
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
            'posture': 10,
            'meal': 5
        };
        return coinRewards[questType] || 3;
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
                'posture': '📊',
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

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showUnlockModal(cost, type, onConfirm) {
        // Remove existing modal
        const existingModal = document.getElementById('unlock-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = this.createUnlockModal(cost, type, onConfirm);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
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
            if (this.currentUser.coins >= cost) {
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
        console.error('Token validation error:', e);
        localStorage.removeItem('authToken');
        redirectToLogin();
    }
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        window.enhancedDashboard = new EnhancedDashboardGamification();
    }, 100);
});

// Global Dark Mode Application
function applyGlobalDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
}

// Apply dark mode immediately
applyGlobalDarkMode();