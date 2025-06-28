// Settings Page Functionality
class SettingsManager {
    constructor() {
        this.darkModeToggle = document.getElementById('dark-mode');
        this.friendRequestsToggle = document.getElementById('friend-requests');
        this.activityUpdatesToggle = document.getElementById('activity-updates');
        this.isDragging = false;
        this.currentToggle = null;
        this.init();
    }

    init() {
        // Initialize dark mode
        this.initDarkMode();
        
        // Initialize other toggles
        this.initOtherToggles();
        
        // Apply initial theme
        this.applyDarkModeTheme();
        
        // Add global mouse/touch event listeners
        this.addGlobalEventListeners();
    }

    addGlobalEventListeners() {
        // Mouse events
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        // Touch events for mobile
        document.addEventListener('touchmove', (e) => this.handleDrag(e), { passive: false });
        document.addEventListener('touchend', () => this.stopDrag());
    }

    initDarkMode() {
        if (this.darkModeToggle) {
            // Load saved preference
            this.loadDarkModePreference();
            
            // Add event listeners
            this.addToggleEventListeners(this.darkModeToggle, 'darkMode', (isEnabled) => {
                this.toggleDarkMode(isEnabled);
            });
        }
    }

    initOtherToggles() {
        // Friend Requests Toggle
        if (this.friendRequestsToggle) {
            this.loadTogglePreference('friendRequests', this.friendRequestsToggle);
            this.addToggleEventListeners(this.friendRequestsToggle, 'friendRequests', (isEnabled) => {
                this.saveTogglePreference('friendRequests', isEnabled);
                this.showToggleFeedback('Friend Requests', isEnabled);
            });
        }

        // Activity Updates Toggle
        if (this.activityUpdatesToggle) {
            this.loadTogglePreference('activityUpdates', this.activityUpdatesToggle);
            this.addToggleEventListeners(this.activityUpdatesToggle, 'activityUpdates', (isEnabled) => {
                this.saveTogglePreference('activityUpdates', isEnabled);
                this.showToggleFeedback('Activity Updates', isEnabled);
            });
        }
    }

    addToggleEventListeners(toggleElement, key, callback) {
        const toggleSwitch = toggleElement.closest('.toggle-switch');
        
        if (!toggleSwitch) return;

        // Click event
        toggleElement.addEventListener('change', (e) => {
            callback(e.target.checked);
        });

        // Mouse down event for drag
        toggleSwitch.addEventListener('mousedown', (e) => {
            this.startDrag(e, toggleElement, toggleSwitch, callback);
        });

        // Touch start event for mobile drag
        toggleSwitch.addEventListener('touchstart', (e) => {
            this.startDrag(e, toggleElement, toggleSwitch, callback);
        });

        // Prevent text selection during drag
        toggleSwitch.addEventListener('selectstart', (e) => e.preventDefault());
    }

    startDrag(event, toggleElement, toggleSwitch, callback) {
        event.preventDefault();
        this.isDragging = true;
        this.currentToggle = { element: toggleElement, switch: toggleSwitch, callback };
        
        // Add dragging class for visual feedback
        toggleSwitch.classList.add('dragging');
        
        // Get initial position
        const rect = toggleSwitch.getBoundingClientRect();
        this.dragStartX = event.clientX || event.touches[0].clientX;
        this.toggleWidth = rect.width;
        this.toggleLeft = rect.left;
    }

    handleDrag(event) {
        if (!this.isDragging || !this.currentToggle) return;
        
        event.preventDefault();
        
        const currentX = event.clientX || event.touches[0].clientX;
        const deltaX = currentX - this.dragStartX;
        const toggleElement = this.currentToggle.element;
        const toggleSwitch = this.currentToggle.switch;
        
        // Calculate drag percentage
        const dragPercentage = Math.max(0, Math.min(1, deltaX / this.toggleWidth));
        
        // Update slider position visually
        const slider = toggleSwitch.querySelector('.slider');
        if (slider) {
            const translateX = dragPercentage * 24; // 24px is the max translation
            slider.style.transform = `translateX(${translateX}px)`;
        }
        
        // Determine if toggle should be on/off based on drag position
        const shouldBeOn = dragPercentage > 0.5;
        
        // Update toggle state if changed
        if (toggleElement.checked !== shouldBeOn) {
            toggleElement.checked = shouldBeOn;
            this.currentToggle.callback(shouldBeOn);
        }
    }

    stopDrag() {
        if (!this.isDragging || !this.currentToggle) return;
        
        this.isDragging = false;
        const toggleSwitch = this.currentToggle.switch;
        
        // Remove dragging class
        toggleSwitch.classList.remove('dragging');
        
        // Reset slider transform
        const slider = toggleSwitch.querySelector('.slider');
        if (slider) {
            slider.style.transform = '';
        }
        
        this.currentToggle = null;
    }

    loadDarkModePreference() {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true' && this.darkModeToggle) {
            this.darkModeToggle.checked = true;
        }
    }

    loadTogglePreference(key, toggleElement) {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            toggleElement.checked = saved === 'true';
        }
    }

    saveTogglePreference(key, value) {
        localStorage.setItem(key, value.toString());
    }

    toggleDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
        
        // Show feedback
        this.showThemeFeedback(isDark);
    }

    applyDarkModeTheme() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
        }
    }

    showThemeFeedback(isDark) {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'theme-feedback';
        feedback.innerHTML = `
            <span class="theme-icon">${isDark ? '🌙' : '☀️'}</span>
            <span class="theme-text">${isDark ? 'Dark Mode' : 'Light Mode'} Enabled</span>
        `;
        
        // Add styles
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isDark ? 'rgb(28,36,34)' : 'white'};
            color: ${isDark ? 'rgb(240,255,250)' : '#333'};
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(feedback);
        
        // Remove after 2 seconds
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    showToggleFeedback(setting, isEnabled) {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'toggle-feedback';
        feedback.innerHTML = `
            <span class="feedback-icon">${isEnabled ? '✅' : '❌'}</span>
            <span class="feedback-text">${setting} ${isEnabled ? 'Enabled' : 'Disabled'}</span>
        `;
        
        // Add styles
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isEnabled ? 'rgb(40, 167, 69)' : 'rgb(220, 53, 69)'};
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            font-size: 0.9rem;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(feedback);
        
        // Remove after 1.5 seconds
        setTimeout(() => {
            feedback.remove();
        }, 1500);
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new SettingsManager();
});

// Global function to check if dark mode is enabled
function isDarkModeEnabled() {
    return localStorage.getItem('darkMode') === 'true';
}

// Global function to apply dark mode to any page
function applyGlobalDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
}

// Apply dark mode immediately for faster loading
applyGlobalDarkMode();
