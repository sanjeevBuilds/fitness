// Shared Sidebar Management for Titles and Badges
class SharedSidebarManager {
    constructor() {
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

        this.init();
    }

    init() {
        this.loadUserData();
        this.updateSidebarDisplay();
        this.setupUserProfileStructure();
    }

    loadUserData() {
        // Load user data from localStorage
        let userData = JSON.parse(localStorage.getItem('userData')) || {};
        
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
        
        this.userData = userData;
        this.selectedTitle = userData.selectedTitle || null;
        this.selectedBadge = userData.selectedBadge || null;
    }

    setupUserProfileStructure() {
        const userProfile = document.querySelector('.user-profile');
        if (!userProfile) return;

        // Check if user-info div already exists
        let userInfo = userProfile.querySelector('.user-info');
        if (!userInfo) {
            // Create user-info container
            userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            
            // Move existing elements into user-info
            const userName = userProfile.querySelector('.user-name');
            const levelBadge = userProfile.querySelector('.level-badge');
            
            if (userName) {
                userProfile.removeChild(userName);
                userInfo.appendChild(userName);
            }
            
            if (levelBadge) {
                userProfile.removeChild(levelBadge);
                userInfo.appendChild(levelBadge);
            }
            
            userProfile.appendChild(userInfo);
        }

        // Ensure user-name has the correct ID for updates
        const userName = userInfo.querySelector('.user-name');
        if (userName && !userName.id) {
            userName.id = 'sidebar-username';
        }
    }

    updateSidebarDisplay() {
        const sidebarUsername = document.getElementById('sidebar-username') || document.querySelector('.user-name');
        if (!sidebarUsername) return;

        const selectedTitle = this.availableTitles.find(t => t.id === this.selectedTitle);
        const selectedBadge = this.availableBadges.find(b => b.id === this.selectedBadge);

        // Update sidebar username to include title prominently
        let displayText = this.userData.profileName || this.userData.fullName || 'User';
        
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
            sidebarUsername.style.textAlign = 'center';
            sidebarUsername.style.margin = '0.5rem 0';
        } else {
            sidebarUsername.style.background = 'none';
            sidebarUsername.style.padding = '0';
            sidebarUsername.style.borderRadius = '0';
            sidebarUsername.style.border = 'none';
            sidebarUsername.style.fontWeight = '600';
            sidebarUsername.style.fontSize = '1.1rem';
            sidebarUsername.style.textAlign = 'center';
            sidebarUsername.style.margin = '0';
        }

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
    }

    // Method to refresh the display (can be called from other pages)
    refreshDisplay() {
        this.loadUserData();
        this.updateSidebarDisplay();
    }
}

// Initialize shared sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.sharedSidebar = new SharedSidebarManager();
});

// Global function to refresh sidebar display
function refreshSidebarDisplay() {
    if (window.sharedSidebar) {
        window.sharedSidebar.refreshDisplay();
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