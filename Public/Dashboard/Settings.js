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

function showLogoutToast() {
    let toast = document.createElement('div');
    toast.className = 'gamified-toast logout-toast';
    toast.innerHTML = '<span class="toast-icon">🚪</span> Logged out! See you soon, adventurer!';
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(()=>toast.remove(), 400); }, 1100);
}
