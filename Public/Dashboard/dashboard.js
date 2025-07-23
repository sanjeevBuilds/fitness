// Auth Check - Don't modify this section
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
        localStorage.removeItem('authToken');
        redirectToLogin();
    }
})();

// Dashboard Gamification Class
class DashboardGamification {
    constructor() {
        this.currentUser = null;
        this.questStates = {};
        this.activityLog = [];
        
        // DOM Elements
        this.coinBalance = document.querySelector('.coin-balance');
        this.currentLevelEl = document.querySelector('.current-level');
        this.xpDisplay = document.querySelector('.xp');
        this.progressFill = document.querySelector('.progress-fill');
        this.levelStatValue = document.querySelector('[data-stat="level"]');
        this.xpStatValue = document.querySelector('[data-stat="xp"]');
        this.activityList = document.getElementById('activity-list');

        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
        this.loadQuestStates();
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('authToken');
            const decoded = window.jwt_decode(token);
            const email = decoded.email;
            
            const response = await fetch(`http://localhost:8000/api/getUser/${email}`);
            if (!response.ok) throw new Error('Failed to fetch user data');
            
            this.currentUser = await response.json();
            
            // Initialize defaults if missing
            this.currentUser.exp = this.currentUser.exp || 0;
            this.currentUser.coins = this.currentUser.coins || 0;
            this.currentUser.level = this.calculateLevel(this.currentUser.exp);
            this.currentUser.activityLog = this.currentUser.activityLog || [];
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

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
            'water': 25,
            'steps': 50,
            'sleep': 30,
            'posture': 40,
            'meal': 20,
            'exercise': 60
        };
        return xpRewards[questType] || 10;
    }

    setupEventListeners() {
        // Daily Quest toggles
        document.querySelectorAll('.quest-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const questItem = e.target.closest('.checklist-item');
                const questType = questItem.dataset.quest;
                this.handleQuestToggle(questType, e.target.checked);
            });
        });

        // Unlock challenge buttons
        document.querySelectorAll('.unlock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cost = parseInt(e.target.dataset.cost);
                this.showUnlockModal(cost, () => {
                    this.unlockChallenge(e.target.closest('.challenge-card'));
                });
            });
        });

        // Unlock title buttons
        document.querySelectorAll('.unlock-title-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cost = parseInt(e.target.dataset.cost);
                this.showUnlockModal(cost, () => {
                    this.unlockTitle(e.target.closest('.title-card'));
                });
            });
        });

        // Modal handlers
        this.setupModalHandlers();
    }

    async handleQuestToggle(questType, isCompleted) {
        const today = new Date().toISOString().slice(0, 10);
        const questKey = `${questType}_${today}`;
        
        // Check if quest is already completed and locked (except steps)
        if (questType !== 'steps' && this.questStates[questKey]) {
            this.showNotification('Quest already completed today!', 'warning');
            // Reset checkbox to checked state
            const checkbox = document.getElementById(`${questType}-quest`);
            if (checkbox) checkbox.checked = true;
            return;
        }

        if (isCompleted) {
            // Award XP and coins
            const xpGained = this.getQuestXP(questType);
            const coinsGained = questType === 'steps' ? 15 : 5;
            
            await this.addXP(xpGained, questType);
            await this.addCoins(coinsGained);
            
            // Lock quest (except steps)
            if (questType !== 'steps') {
                this.questStates[questKey] = true;
                this.saveQuestStates();
            }
            
            // Add to activity log
            this.addActivity(questType, xpGained);
            
            // Show success notification
            this.showNotification(`Quest completed! +${xpGained} XP, +${coinsGained} coins`, 'success');
            
            // Update UI
            this.updateUI();
            
        } else if (questType === 'steps') {
            // Steps can be unchecked (only steps quest allows this)
            this.showNotification('Steps quest progress updated', 'info');
        }
    }

    async addXP(amount, source = 'quest') {
        const oldLevel = this.currentUser.level;
        this.currentUser.exp += amount;
        this.currentUser.level = this.calculateLevel(this.currentUser.exp);
        
        // Check for level up
        if (this.currentUser.level > oldLevel) {
            this.showLevelUpNotification(this.currentUser.level);
            this.addActivity('levelup', 0, `Reached Level ${this.currentUser.level}!`);
        }
        
        // Sync with backend
        try {
            await fetch(`http://localhost:8000/api/addExp/${this.currentUser.email}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expToAdd: amount })
            });
        } catch (error) {
            console.error('Failed to sync XP:', error);
        }
    }

    async addCoins(amount) {
        this.currentUser.coins = (this.currentUser.coins || 0) + amount;
        
        // Sync with backend (you may need to add this endpoint)
        try {
            await fetch(`http://localhost:8000/api/updateUser/${this.currentUser.email}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coins: this.currentUser.coins })
            });
        } catch (error) {
            console.error('Failed to sync coins:', error);
        }
    }

    addActivity(type, xp, customMessage = null) {
        const activityMessages = {
            'water': 'Completed hydration quest',
            'steps': 'Reached step goal',
            'sleep': 'Completed sleep quest',
            'posture': 'Completed posture scan',
            'meal': 'Logged daily meal',
            'exercise': 'Completed workout',
            'levelup': customMessage || 'Leveled up!'
        };

        const activity = {
            icon: this.getActivityIcon(type),
            xp: xp,
            message: customMessage || activityMessages[type] || 'Completed activity',
            timestamp: new Date()
        };

        this.activityLog.unshift(activity);
        if (this.activityLog.length > 10) {
            this.activityLog = this.activityLog.slice(0, 10);
        }

        this.updateActivityList();
    }

    getActivityIcon(type) {
        const icons = {
            'water': '💧',
            'steps': '👣',
            'sleep': '😴',
            'posture': '📊',
            'meal': '🍽️',
            'exercise': '💪',
            'levelup': '⭐'
        };
        return icons[type] || '🎯';
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

        // Update quest states
        this.updateQuestUI();
    }

    updateQuestUI() {
        const today = new Date().toISOString().slice(0, 10);
        
        document.querySelectorAll('.checklist-item').forEach(item => {
            const questType = item.dataset.quest;
            const checkbox = item.querySelector('.quest-checkbox');
            const questKey = `${questType}_${today}`;
            
            if (this.questStates[questKey] && questType !== 'steps') {
                // Quest is completed and locked
                checkbox.checked = true;
                checkbox.disabled = true;
                item.classList.add('completed');
            } else {
                checkbox.disabled = false;
                item.classList.remove('completed');
            }
        });
    }

    updateActivityList() {
        if (!this.activityList) return;

        this.activityList.innerHTML = '';
        this.activityLog.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <span class="activity-icon">${activity.icon}</span>
                <div class="activity-details">
                    ${activity.xp > 0 ? `<span class="activity-xp">+${activity.xp} XP</span>` : ''}
                    ${activity.message}
                </div>
            `;
            this.activityList.appendChild(activityItem);
        });
    }

    loadQuestStates() {
        const saved = localStorage.getItem('questStates');
        if (saved) {
            this.questStates = JSON.parse(saved);
        }
        this.updateQuestUI();
    }

    saveQuestStates() {
        localStorage.setItem('questStates', JSON.stringify(this.questStates));
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showLevelUpNotification(newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px;">🎉</div>
                <h2 style="color: #FFD700; margin: 10px 0;">LEVEL UP!</h2>
                <p style="color: white; font-size: 18px;">You've reached Level ${newLevel}!</p>
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
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }

    showUnlockModal(cost, onConfirm) {
        const modal = document.getElementById('unlock-modal');
        const modalCost = document.getElementById('modal-cost');
        const confirmBtn = document.getElementById('confirm-unlock');
        
        if (modalCost) modalCost.textContent = cost;
        if (modal) modal.style.display = 'flex';
        
        confirmBtn.onclick = () => {
            if (this.currentUser.coins >= cost) {
                this.currentUser.coins -= cost;
                this.updateUI();
                onConfirm();
                modal.style.display = 'none';
                this.showNotification(`Successfully unlocked! -${cost} coins`, 'success');
            } else {
                this.showNotification('Not enough coins!', 'warning');
            }
        };
    }

    setupModalHandlers() {
        const modal = document.getElementById('unlock-modal');
        const closeBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-unlock');
        
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => modal.style.display = 'none';
        }
        
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) modal.style.display = 'none';
            };
        }
    }

    unlockChallenge(challengeCard) {
        challengeCard.classList.add('unlocked');
        const unlockBtn = challengeCard.querySelector('.unlock-btn');
        if (unlockBtn) {
            unlockBtn.textContent = 'Challenge Active';
            unlockBtn.disabled = true;
        }
    }

    unlockTitle(titleCard) {
        titleCard.classList.add('unlocked');
        const unlockBtn = titleCard.querySelector('.unlock-title-btn');
        if (unlockBtn) {
            unlockBtn.textContent = 'Unlocked';
            unlockBtn.disabled = true;
        }
    }

    // Reset daily quests at midnight
    resetDailyQuests() {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        
        // Remove yesterday's quest states (except steps which can be toggled)
        Object.keys(this.questStates).forEach(key => {
            if (key.includes(yesterday) && !key.startsWith('steps_')) {
                delete this.questStates[key];
            }
        });
        
        this.saveQuestStates();
        this.updateQuestUI();
    }
}

// CSS Animations (inject into page)
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
    
    .checklist-item.completed {
        opacity: 0.7;
        background: #f0f9ff;
        border-left: 4px solid #4CAF50;
    }
    
    .checklist-item.completed .quest-checkbox {
        cursor: not-allowed;
    }
    
    .notification {
        font-weight: 500;
        font-size: 14px;
    }
    
    .level-up-notification {
        font-family: 'Inter', sans-serif;
    }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardGamification = new DashboardGamification();
    
    // Reset quests at midnight
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
        window.dashboardGamification.resetDailyQuests();
        // Set up daily reset
        setInterval(() => {
            window.dashboardGamification.resetDailyQuests();
        }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
});

// Load user profile data from localStorage


// Global Dark Mode Application
function applyGlobalDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
}

// Apply dark mode immediately for faster loading
applyGlobalDarkMode();