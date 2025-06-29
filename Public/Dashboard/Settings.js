// Settings Page Management
class SettingsManager {
    constructor() {
        this.initializeSettings();
        this.setupEventListeners();
        this.setupDragFunctionality();
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

        // Update password button
        const updatePasswordBtn = document.querySelector('.update-btn');
        if (updatePasswordBtn) {
            updatePasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.updatePassword();
            });
        }

        // Add drag functionality to all toggle switches
        this.setupDragFunctionality();
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

    updatePassword() {
        const passwordInput = document.getElementById('password');
        const newPassword = passwordInput.value;

        if (!newPassword || newPassword === '••••••••') {
            this.showToast('Please enter a new password');
            return;
        }

        if (newPassword.length < 6) {
            this.showToast('Password must be at least 6 characters long');
            return;
        }

        // Here you would typically make an API call to update the password
        // For now, we'll just show a success message
        this.showToast('Password updated successfully!');
        passwordInput.value = '••••••••';
    }

    showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        
        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new SettingsManager();
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
