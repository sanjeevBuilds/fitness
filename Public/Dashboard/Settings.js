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
                if (!selectedAvatar) return;
                const userData = JSON.parse(localStorage.getItem('userData'));
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
