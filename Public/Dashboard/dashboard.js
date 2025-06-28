// Dashboard Gamification System
class DashboardManager {
    constructor() {
        this.currentXP = 750;
        this.totalXP = 1000;
        this.coins = 1250;
        this.rank = 42;
        this.quests = {
            water: { completed: false, xp: 25, target: 2, current: 0 },
            steps: { completed: false, xp: 50, target: 5000, current: 0 },
            sleep: { completed: false, xp: 30, target: 7, current: 0 },
            posture: { completed: false, xp: 40, target: 1, current: 0 },
            meal: { completed: false, xp: 20, target: 1, current: 0 },
            exercise: { completed: false, xp: 60, target: 30, current: 0 }
        };
        this.stats = {
            calories: 0,
            protein: 0,
            steps: 0,
            water: 0,
            sleep: 0,
            posture: 88
        };
        this.activityLog = [];
        
        // Mini Challenges
        this.miniChallenges = {
            'night-walk': { unlocked: false, cost: 15, xp: 20, badge: 'Moonwalker' },
            'fruit-day': { unlocked: false, cost: 20, xp: 30, badge: 'Avatar Hat' },
            'hydration-hero': { unlocked: false, cost: 25, xp: 40, badge: 'Water Badge + 2x XP' }
        };
        
        // Titles & Ranks
        this.titles = {
            'step-warrior': { unlocked: false, cost: 75, progress: 6, target: 10, equipped: false },
            'protein-beast': { unlocked: false, cost: 100, progress: 80, target: 100, equipped: false },
            'streak-legend': { unlocked: false, cost: 200, progress: 5, target: 14, equipped: false }
        };
        
        // Smart Quest Scaling
        this.smartQuests = {
            steps: { current: 12000, goal: 10000, xp: 50, coins: 15, nextGoal: 20000 },
            calories: { current: 1700, goal: 2000, xp: 30, coins: 0 },
            protein: { current: 95, goal: 100, xp: 25, coins: 0 }
        };
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.checkFoodLog();
        this.startPeriodicUpdates();
        this.updateChallengeTimer();
    }

    setupEventListeners() {
        // Quest checkboxes
        const questCheckboxes = document.querySelectorAll('.quest-checkbox');
        questCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleQuestToggle(e.target);
            });
        });

        // Mini challenge unlock buttons
        const unlockButtons = document.querySelectorAll('.unlock-btn');
        unlockButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.showUnlockModal(e.target);
            });
        });

        // Title unlock buttons
        const titleButtons = document.querySelectorAll('.unlock-title-btn');
        titleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleTitleUnlock(e.target);
            });
        });

        // Modal event listeners
        const modal = document.getElementById('unlock-modal');
        const closeBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-unlock');
        const confirmBtn = document.getElementById('confirm-unlock');

        if (closeBtn) closeBtn.addEventListener('click', () => this.hideUnlockModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideUnlockModal());
        if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmUnlock());

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideUnlockModal();
            });
        }

        // Auto-complete meal quest when food is logged
        this.checkMealQuest();
    }

    showUnlockModal(button) {
        const challengeType = button.closest('.challenge-card').dataset.challenge;
        const cost = parseInt(button.dataset.cost);
        const challenge = this.miniChallenges[challengeType];
        
        if (!challenge) return;
        
        const modal = document.getElementById('unlock-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalCost = document.getElementById('modal-cost');
        
        if (this.coins < cost) {
            this.showNotification('Insufficient Coins', 'You need more coins to unlock this challenge!');
            return;
        }
        
        modalTitle.textContent = `Unlock ${this.getChallengeName(challengeType)}`;
        modalMessage.textContent = `Are you sure you want to unlock this challenge for ${cost} coins?`;
        modalCost.textContent = cost;
        
        // Store current challenge for confirmation
        this.currentUnlockChallenge = challengeType;
        
        modal.style.display = 'block';
    }

    hideUnlockModal() {
        const modal = document.getElementById('unlock-modal');
        modal.style.display = 'none';
        this.currentUnlockChallenge = null;
    }

    confirmUnlock() {
        if (!this.currentUnlockChallenge) return;
        
        const challenge = this.miniChallenges[this.currentUnlockChallenge];
        const cost = challenge.cost;
        
        if (this.coins >= cost) {
            this.coins -= cost;
            challenge.unlocked = true;
            
            this.addXP(challenge.xp);
            this.addActivity(`Unlocked ${this.getChallengeName(this.currentUnlockChallenge)}`, challenge.xp);
            
            // Update UI
            const challengeCard = document.querySelector(`[data-challenge="${this.currentUnlockChallenge}"]`);
            const unlockBtn = challengeCard.querySelector('.unlock-btn');
            unlockBtn.textContent = 'Challenge Unlocked!';
            unlockBtn.disabled = true;
            unlockBtn.classList.remove('btn-primary');
            unlockBtn.classList.add('btn-success');
            
            this.showNotification('Challenge Unlocked!', `You've unlocked ${this.getChallengeName(this.currentUnlockChallenge)}!`);
            this.saveData();
        }
        
        this.hideUnlockModal();
    }

    handleTitleUnlock(button) {
        const titleType = button.closest('.title-card').dataset.title;
        const title = this.titles[titleType];
        
        if (this.coins >= title.cost) {
            this.coins -= title.cost;
            title.unlocked = true;
            
            this.addActivity(`Unlocked ${this.getTitleName(titleType)}`, 50);
            this.showTitleUnlockModal(titleType);
            this.updateTitleUI(titleType);
            this.saveData();
        } else {
            this.showNotification('Insufficient Coins', 'You need more coins to unlock this title!');
        }
    }

    showTitleUnlockModal(titleType) {
        const titleName = this.getTitleName(titleType);
        this.showNotification('Title Unlocked! 🎉', `You've unlocked '${titleName}'! Do you want to equip it now?`);
        
        // Add equip button to notification (simplified)
        setTimeout(() => {
            if (confirm(`Equip '${titleName}' now?`)) {
                this.equipTitle(titleType);
            }
        }, 1000);
    }

    equipTitle(titleType) {
        // Unequip all other titles
        Object.keys(this.titles).forEach(key => {
            this.titles[key].equipped = false;
        });
        
        // Equip selected title
        this.titles[titleType].equipped = true;
        this.addActivity(`Equipped ${this.getTitleName(titleType)}`, 10);
        this.saveData();
    }

    updateTitleUI(titleType) {
        const titleCard = document.querySelector(`[data-title="${titleType}"]`);
        const unlockBtn = titleCard.querySelector('.unlock-title-btn');
        
        if (this.titles[titleType].unlocked) {
            titleCard.classList.add('unlocked');
            unlockBtn.textContent = this.titles[titleType].equipped ? 'Equipped' : 'Equip';
            unlockBtn.classList.remove('btn-secondary');
            unlockBtn.classList.add('btn-primary');
        }
    }

    getChallengeName(challengeType) {
        const names = {
            'night-walk': 'Night Walk',
            'fruit-day': 'Fruit Day',
            'hydration-hero': 'Hydration Hero'
        };
        return names[challengeType] || challengeType;
    }

    getTitleName(titleType) {
        const names = {
            'step-warrior': 'Step Warrior',
            'protein-beast': 'Protein Beast',
            'streak-legend': 'Streak Legend'
        };
        return names[titleType] || titleType;
    }

    updateChallengeTimer() {
        // Simulate challenge rotation every 3 days
        const now = new Date();
        const lastRotation = new Date(localStorage.getItem('lastChallengeRotation') || now);
        const daysSinceRotation = Math.floor((now - lastRotation) / (1000 * 60 * 60 * 24));
        const daysUntilRotation = 3 - (daysSinceRotation % 3);
        
        const timerElement = document.getElementById('challenge-timer');
        if (timerElement) {
            timerElement.textContent = `Refreshes in ${daysUntilRotation} days`;
        }
        
        // Auto-rotate challenges every 3 days
        if (daysSinceRotation >= 3) {
            this.rotateChallenges();
            localStorage.setItem('lastChallengeRotation', now.toISOString());
        }
    }

    rotateChallenges() {
        // Reset all challenges
        Object.keys(this.miniChallenges).forEach(key => {
            this.miniChallenges[key].unlocked = false;
        });
        
        // Update UI
        const challengeCards = document.querySelectorAll('.challenge-card');
        challengeCards.forEach(card => {
            const unlockBtn = card.querySelector('.unlock-btn');
            unlockBtn.textContent = 'Unlock Challenge';
            unlockBtn.disabled = false;
            unlockBtn.classList.remove('btn-success');
            unlockBtn.classList.add('btn-primary');
        });
        
        this.addActivity('Challenges Refreshed!', 25);
        this.showNotification('Challenges Refreshed!', 'New challenges are available!');
    }

    handleQuestToggle(checkbox) {
        const questType = checkbox.id.replace('-quest', '');
        const questItem = document.querySelector(`[data-quest="${questType}"]`);
        
        if (checkbox.checked) {
            this.completeQuest(questType, questItem);
        } else {
            this.uncompleteQuest(questType, questItem);
        }
    }

    completeQuest(questType, questItem) {
        const quest = this.quests[questType];
        if (!quest.completed) {
            quest.completed = true;
            quest.current = quest.target;
            
            // Add XP
            this.addXP(quest.xp);
            
            // Update stats
            this.updateStatsFromQuest(questType);
            
            // Visual feedback
            questItem.classList.add('completed');
            this.showXPAnimation(questItem, quest.xp);
            
            // Add to activity log
            this.addActivity(`Completed ${this.getQuestName(questType)}`, quest.xp);
            
            // Save data
            this.saveData();
        }
    }

    uncompleteQuest(questType, questItem) {
        const quest = this.quests[questType];
        if (quest.completed) {
            quest.completed = false;
            quest.current = 0;
            
            // Remove XP
            this.removeXP(quest.xp);
            
            // Update stats
            this.updateStatsFromQuest(questType);
            
            // Visual feedback
            questItem.classList.remove('completed');
            
            // Save data
            this.saveData();
        }
    }

    addXP(amount) {
        this.currentXP += amount;
        this.coins += Math.floor(amount / 10); // 1 coin per 10 XP
        
        // Check for level up
        if (this.currentXP >= this.totalXP) {
            this.levelUp();
        }
        
        this.updateDisplay();
    }

    removeXP(amount) {
        this.currentXP = Math.max(0, this.currentXP - amount);
        this.coins = Math.max(0, this.coins - Math.floor(amount / 10));
        this.updateDisplay();
    }

    levelUp() {
        // Simple level up system
        this.currentXP -= this.totalXP;
        this.totalXP = Math.floor(this.totalXP * 1.2); // 20% increase per level
        
        // Add level up activity
        this.addActivity('Level Up! 🎉', 100);
        
        // Show level up notification
        this.showNotification('Level Up! 🎉', 'Congratulations! You\'ve reached a new level!');
    }

    updateStatsFromQuest(questType) {
        switch (questType) {
            case 'water':
                this.stats.water = this.quests.water.completed ? 2 : 0;
                break;
            case 'steps':
                this.stats.steps = this.quests.steps.completed ? 5000 : 0;
                break;
            case 'sleep':
                this.stats.sleep = this.quests.sleep.completed ? 7 : 0;
                break;
            case 'posture':
                this.stats.posture = this.quests.posture.completed ? 95 : 88;
                break;
            case 'meal':
                // This will be handled by food log integration
                break;
            case 'exercise':
                // This could be expanded for exercise tracking
                break;
        }
        this.updateDisplay();
    }

    checkFoodLog() {
        // Check if food has been logged today
        const today = new Date().toDateString();
        const foodLogData = localStorage.getItem('foodLogMeals');
        
        if (foodLogData) {
            try {
                const meals = JSON.parse(foodLogData);
                const todayMeals = meals.filter(meal => {
                    const mealDate = new Date(meal.timestamp).toDateString();
                    return mealDate === today;
                });
                
                if (todayMeals.length > 0) {
                    // Calculate totals
                    const totals = todayMeals.reduce((acc, meal) => {
                        acc.calories += meal.calories;
                        acc.protein += meal.protein;
                        return acc;
                    }, { calories: 0, protein: 0 });
                    
                    this.stats.calories = totals.calories;
                    this.stats.protein = totals.protein;
                    
                    // Update smart quests
                    this.smartQuests.calories.current = totals.calories;
                    this.smartQuests.protein.current = totals.protein;
                    
                    // Auto-complete meal quest
                    if (!this.quests.meal.completed) {
                        this.quests.meal.completed = true;
                        this.quests.meal.current = 1;
                        this.addXP(this.quests.meal.xp);
                        this.addActivity('Logged today\'s meal', this.quests.meal.xp);
                        
                        const mealQuestItem = document.querySelector('[data-quest="meal"]');
                        const mealCheckbox = document.getElementById('meal-quest');
                        mealCheckbox.checked = true;
                        mealQuestItem.classList.add('completed');
                    }
                }
            } catch (error) {
                console.error('Error parsing food log data:', error);
            }
        }
    }

    checkMealQuest() {
        // Check if meal quest should be auto-completed
        const today = new Date().toDateString();
        const foodLogData = localStorage.getItem('foodLogMeals');
        
        if (foodLogData) {
            try {
                const meals = JSON.parse(foodLogData);
                const todayMeals = meals.filter(meal => {
                    const mealDate = new Date(meal.timestamp).toDateString();
                    return mealDate === today;
                });
                
                if (todayMeals.length > 0 && !this.quests.meal.completed) {
                    this.quests.meal.completed = true;
                    this.quests.meal.current = 1;
                    this.addXP(this.quests.meal.xp);
                    this.addActivity('Logged today\'s meal', this.quests.meal.xp);
                    
                    const mealQuestItem = document.querySelector('[data-quest="meal"]');
                    const mealCheckbox = document.getElementById('meal-quest');
                    mealCheckbox.checked = true;
                    mealQuestItem.classList.add('completed');
                }
            } catch (error) {
                console.error('Error checking meal quest:', error);
            }
        }
    }

    updateDisplay() {
        // Update XP progress
        const progressFill = document.querySelector('.progress-fill');
        const xpText = document.querySelector('.xp');
        const percentage = (this.currentXP / this.totalXP) * 100;
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (xpText) xpText.textContent = `${this.currentXP}/${this.totalXP} XP`;
        
        // Update coin balance in wallet
        const coinBalance = document.getElementById('coin-balance');
        if (coinBalance) coinBalance.textContent = this.coins.toLocaleString();
        
        // Update user stats (only rank now, coins removed)
        const rankValue = document.querySelector('.user-stats .stat-value');
        if (rankValue) rankValue.textContent = `#${this.rank}`;
        
        // Update live stats in daily summary
        this.updateLiveStats();
        
        // Update quest checkboxes
        this.updateQuestCheckboxes();
        
        // Update smart quests
        this.updateSmartQuests();
        
        // Update titles
        this.updateTitles();
    }

    updateLiveStats() {
        const displays = {
            calories: document.getElementById('calories-display'),
            protein: document.getElementById('protein-display'),
            steps: document.getElementById('steps-display'),
            water: document.getElementById('water-display'),
            sleep: document.getElementById('sleep-display'),
            posture: document.getElementById('posture-display')
        };
        
        const changes = {
            calories: document.getElementById('calories-change'),
            protein: document.getElementById('protein-change'),
            steps: document.getElementById('steps-change'),
            water: document.getElementById('water-change'),
            sleep: document.getElementById('sleep-change')
        };
        
        // Update values in daily summary
        Object.keys(displays).forEach(key => {
            if (displays[key]) {
                displays[key].textContent = this.stats[key].toLocaleString();
            }
        });
        
        // Update change indicators (simplified)
        Object.keys(changes).forEach(key => {
            if (changes[key]) {
                const change = this.stats[key] > 0 ? '+' : '';
                changes[key].textContent = `${change}${this.stats[key]}%`;
            }
        });
    }

    updateSmartQuests() {
        Object.keys(this.smartQuests).forEach(questType => {
            const quest = this.smartQuests[questType];
            const questElement = document.querySelector(`[data-quest="${questType}"]`);
            
            if (questElement) {
                const progressFill = questElement.querySelector('.progress-fill');
                const progressText = questElement.querySelector('.progress-text');
                const rewardXp = questElement.querySelector('.reward-xp');
                const rewardCoins = questElement.querySelector('.reward-coins');
                const scalingNotice = questElement.querySelector('.scaling-notice');
                
                const percentage = Math.min((quest.current / quest.goal) * 100, 100);
                
                if (progressFill) progressFill.style.width = `${percentage}%`;
                if (progressText) progressText.textContent = `${quest.current.toLocaleString()} / ${quest.goal.toLocaleString()}`;
                if (rewardXp) rewardXp.textContent = `+${quest.xp} XP`;
                if (rewardCoins) rewardCoins.textContent = `+${quest.coins} Coins`;
                
                // Show scaling notice if exceeded
                if (quest.current > quest.goal && scalingNotice) {
                    scalingNotice.style.display = 'inline-block';
                    questElement.classList.add('exceeded');
                } else if (scalingNotice) {
                    scalingNotice.style.display = 'none';
                    questElement.classList.remove('exceeded');
                }
            }
        });
    }

    updateTitles() {
        Object.keys(this.titles).forEach(titleType => {
            const title = this.titles[titleType];
            const titleCard = document.querySelector(`[data-title="${titleType}"]`);
            
            if (titleCard) {
                const progressFill = titleCard.querySelector('.progress-fill');
                const progressText = titleCard.querySelector('.progress-text');
                const unlockBtn = titleCard.querySelector('.unlock-title-btn');
                
                const percentage = (title.progress / title.target) * 100;
                
                if (progressFill) progressFill.style.width = `${percentage}%`;
                if (progressText) {
                    if (titleType === 'protein-beast') {
                        progressText.textContent = `${title.progress}/${title.target}g avg`;
                    } else {
                        progressText.textContent = `${title.progress}/${title.target} days`;
                    }
                }
                
                if (title.unlocked && unlockBtn) {
                    unlockBtn.textContent = title.equipped ? 'Equipped' : 'Equip';
                    unlockBtn.classList.remove('btn-secondary');
                    unlockBtn.classList.add('btn-primary');
                    titleCard.classList.add('unlocked');
                }
            }
        });
    }

    updateQuestCheckboxes() {
        Object.keys(this.quests).forEach(questType => {
            const checkbox = document.getElementById(`${questType}-quest`);
            const questItem = document.querySelector(`[data-quest="${questType}"]`);
            
            if (checkbox && questItem) {
                checkbox.checked = this.quests[questType].completed;
                if (this.quests[questType].completed) {
                    questItem.classList.add('completed');
                } else {
                    questItem.classList.remove('completed');
                }
            }
        });
    }

    showXPAnimation(element, xp) {
        const xpElement = element.querySelector('.xp-reward');
        if (xpElement) {
            xpElement.classList.add('xp-gain-animation');
            setTimeout(() => {
                xpElement.classList.remove('xp-gain-animation');
            }, 500);
        }
    }

    addActivity(description, xp) {
        const activity = {
            id: Date.now(),
            description,
            xp,
            timestamp: new Date().toISOString()
        };
        
        this.activityLog.unshift(activity);
        
        // Keep only last 10 activities
        if (this.activityLog.length > 10) {
            this.activityLog = this.activityLog.slice(0, 10);
        }
        
        this.updateActivityList();
    }

    updateActivityList() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        activityList.innerHTML = '';
        
        this.activityLog.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <span class="activity-icon">🎯</span>
                <div class="activity-details">
                    <span class="activity-xp">+${activity.xp} XP</span>
                    ${activity.description}
                </div>
            `;
            activityList.appendChild(activityItem);
        });
    }

    getQuestName(questType) {
        const names = {
            water: 'Hydration Master',
            steps: 'Step Champion',
            sleep: 'Sleep Warrior',
            posture: 'Posture Pro',
            meal: 'Nutrition Tracker',
            exercise: 'Fitness Fanatic'
        };
        return names[questType] || questType;
    }

    showNotification(title, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <h3>${title}</h3>
            <p>${message}</p>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-btn);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    startPeriodicUpdates() {
        // Check for food log updates every 30 seconds
        setInterval(() => {
            this.checkFoodLog();
        }, 30000);
        
        // Update challenge timer every hour
        setInterval(() => {
            this.updateChallengeTimer();
        }, 3600000);
    }

    saveData() {
        const data = {
            currentXP: this.currentXP,
            totalXP: this.totalXP,
            coins: this.coins,
            rank: this.rank,
            quests: this.quests,
            stats: this.stats,
            activityLog: this.activityLog,
            miniChallenges: this.miniChallenges,
            titles: this.titles,
            smartQuests: this.smartQuests,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('dashboardData', JSON.stringify(data));
    }

    loadData() {
        const data = localStorage.getItem('dashboardData');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.currentXP = parsed.currentXP || 750;
                this.totalXP = parsed.totalXP || 1000;
                this.coins = parsed.coins || 1250;
                this.rank = parsed.rank || 42;
                this.quests = parsed.quests || this.quests;
                this.stats = parsed.stats || this.stats;
                this.activityLog = parsed.activityLog || this.activityLog;
                this.miniChallenges = parsed.miniChallenges || this.miniChallenges;
                this.titles = parsed.titles || this.titles;
                this.smartQuests = parsed.smartQuests || this.smartQuests;
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new DashboardManager();
});
