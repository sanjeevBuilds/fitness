// Buddies Page JavaScript
console.log('Buddies.js loaded successfully');

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

// Load user data for sidebar (match dashboard)
(function() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        const avatar = document.getElementById('sidebar-avatar');
        const name = document.getElementById('sidebar-username');
        const level = document.getElementById('sidebar-userlevel');
        if (avatar && userData.avatar) avatar.src = '../../assets/' + userData.avatar;
        if (name && userData.profileName) name.textContent = userData.profileName;
        if (level && userData.level) level.textContent = 'Level ' + userData.level;
    }
})();

// Friend request acceptance functionality
function acceptRequest(button) {
    // Change button text to "Added"
    button.textContent = 'Added';
    
    // Change button style to success (green)
    button.classList.remove('btn-primary');
    button.classList.add('btn-success');
    
    // Disable both accept and reject buttons
    const requestActions = button.closest('.request-actions');
    const rejectBtn = requestActions.querySelector('.reject-btn');
    rejectBtn.disabled = true;
    button.disabled = true;
    
    // Optional: Remove the request item after a delay
    setTimeout(() => {
        const requestItem = button.closest('.request-item');
        if (requestItem) {
            requestItem.style.opacity = '0';
            requestItem.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                requestItem.remove();
            }, 300);
        }
    }, 2000);
}

// Friend request rejection functionality
function rejectRequest(button) {
    // Change button text to "Rejected"
    button.textContent = 'Rejected';
    
    // Change button style to secondary (gray)
    button.classList.remove('btn-danger');
    button.classList.add('btn-secondary');
    
    // Disable both accept and reject buttons
    const requestActions = button.closest('.request-actions');
    const acceptBtn = requestActions.querySelector('.accept-btn');
    acceptBtn.disabled = true;
    button.disabled = true;
    
    // Remove the request item after a delay
    setTimeout(() => {
        const requestItem = button.closest('.request-item');
        if (requestItem) {
            requestItem.style.opacity = '0';
            requestItem.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                requestItem.remove();
            }, 300);
        }
    }, 1500);
}

// Reject all friend requests functionality
function rejectAllRequests() {
    const rejectButtons = document.querySelectorAll('.reject-btn');
    rejectButtons.forEach(button => {
        rejectRequest(button);
    });
    
    // Disable the reject all button
    const rejectAllBtn = document.querySelector('.reject-all-btn');
    rejectAllBtn.disabled = true;
    rejectAllBtn.textContent = 'All Rejected';
}

// Toggle friend requests section
function toggleFriendRequests() {
    console.log('Toggle function called');
    
    const requestList = document.getElementById('request-list');
    const toggleArrow = document.querySelector('.toggle-arrow');
    
    console.log('Request list element:', requestList);
    console.log('Toggle arrow element:', toggleArrow);
    
    if (!requestList || !toggleArrow) {
        console.error('Required elements not found');
        return;
    }
    
    const isCollapsed = requestList.classList.contains('collapsed');
    console.log('Is collapsed:', isCollapsed);
    
    if (isCollapsed) {
        // Expand
        console.log('Expanding...');
        requestList.classList.remove('collapsed');
        toggleArrow.classList.remove('collapsed');
        toggleArrow.textContent = '▼';
    } else {
        // Collapse
        console.log('Collapsing...');
        requestList.classList.add('collapsed');
        toggleArrow.classList.add('collapsed');
        toggleArrow.textContent = '▲';
    }
    
    console.log('Final collapsed state:', requestList.classList.contains('collapsed'));
}

// Copy routine functionality
function copyRoutine(button) {
    const friendItem = button.closest('.friend-item');
    const friendName = friendItem.querySelector('h3').textContent;
    
    // Change button text temporarily
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#28a745';
    button.style.color = 'white';
    button.style.borderColor = '#28a745';
    
    // Show feedback notification
    showCopyFeedback(friendName);
    
    // Reset button after 2 seconds
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
        button.style.color = '';
        button.style.borderColor = '';
    }, 2000);
}

// Show copy feedback notification
function showCopyFeedback(friendName) {
    const feedback = document.createElement('div');
    feedback.className = 'copy-feedback';
    feedback.innerHTML = `
        <span class="feedback-icon">📋</span>
        <span class="feedback-text">${friendName}'s routine copied!</span>
    `;
    
    // Add styles
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
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
    
    // Remove after 2 seconds
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all accept buttons
    const acceptButtons = document.querySelectorAll('.accept-btn');
    acceptButtons.forEach(button => {
        button.addEventListener('click', function() {
            acceptRequest(this);
        });
    });
    
    // Add click event listeners to all reject buttons
    const rejectButtons = document.querySelectorAll('.reject-btn');
    rejectButtons.forEach(button => {
        button.addEventListener('click', function() {
            rejectRequest(this);
        });
    });
    
    // Add click event listener to reject all button
    const rejectAllBtn = document.querySelector('.reject-all-btn');
    if (rejectAllBtn) {
        rejectAllBtn.addEventListener('click', rejectAllRequests);
    }
    
    // Add click event listener to toggle button
    const toggleBtn = document.getElementById('requests-toggle');
    console.log('Toggle button found:', toggleBtn);
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            console.log('Toggle button clicked');
            e.stopPropagation(); // Prevent event bubbling
            toggleFriendRequests();
        });
    }
    
    // Add click event listener to header for toggle (bonus)
    const requestsHeader = document.getElementById('requests-header');
    console.log('Requests header found:', requestsHeader);
    if (requestsHeader) {
        requestsHeader.addEventListener('click', function(e) {
            console.log('Header clicked, target:', e.target);
            // Don't toggle if clicking on buttons
            if (!e.target.closest('.btn')) {
                console.log('Header toggle triggered');
                toggleFriendRequests();
            }
        });
    }
    
    // Add click event listeners to copy routine buttons
    const copyRoutineButtons = document.querySelectorAll('.copy-routine-btn');
    copyRoutineButtons.forEach(button => {
        button.addEventListener('click', function() {
            copyRoutine(this);
        });
    });

    // --- Buddies Search Functionality ---
    const searchBar = document.querySelector('.search-bar');
    const friendsList = document.querySelector('.friends-list');
    const searchResults = document.querySelector('.search-results');
    if (searchBar && friendsList && searchResults) {
        searchBar.addEventListener('input', async function() {
            const query = searchBar.value.trim();
            if (!query) {
                searchResults.innerHTML = '';
                return;
            }
            try {
                const res = await fetch(`http://localhost:8000/api/searchUsers?query=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('Failed to fetch users');
                let users = await res.json();
                // Hide current user from search results
                let currentUser = null;
                try {
                    currentUser = JSON.parse(localStorage.getItem('userData'));
                } catch (e) {}
                if (currentUser) {
                    users = users.filter(u => {
                        // Prefer _id, fallback to email
                        if (u._id && currentUser._id) return u._id !== currentUser._id;
                        if (u.email && currentUser.email) return u.email !== currentUser.email;
                        return true;
                    });
                }
                // Render users in searchResults (highly gamified)
                searchResults.innerHTML = '';
                if (users.length === 0) {
                    searchResults.innerHTML = '<div class="no-results">No users found.</div>';
                    return;
                }
                users.forEach(user => {
                    // Card container
                    const card = document.createElement('div');
                    card.className = 'friend-item search-result-item';
                    card.style.display = 'flex';
                    card.style.alignItems = 'center';
                    card.style.gap = '1rem';
                    card.style.padding = '0.8rem 1.2rem';
                    card.style.marginBottom = '1rem';
                    card.style.background = 'linear-gradient(120deg, #f7fcfa 80%, #eafff3 100%)';
                    card.style.border = '2px solid #39e6a0';
                    card.style.borderRadius = '14px';
                    card.style.boxShadow = '0 3px 16px 0 #1ec87822, 0 1px 0 #ffe066';
                    card.style.position = 'relative';
                    card.style.transition = 'box-shadow 0.3s, border-color 0.3s';
                    card.addEventListener('mouseenter', () => {
                        card.style.boxShadow = '0 0 12px 4px #1ec87855, 0 1px 0 #ffe066';
                        card.style.borderColor = '#ffe066';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.boxShadow = '0 3px 16px 0 #1ec87822, 0 1px 0 #ffe066';
                        card.style.borderColor = '#39e6a0';
                    });
                    // Avatar wrapper
                    const avatarWrap = document.createElement('div');
                    avatarWrap.style.position = 'relative';
                    avatarWrap.style.display = 'inline-block';
                    // Avatar
                    const avatar = document.createElement('img');
                    avatar.src = `../../assets/${user.avatar || 'avator1.jpeg'}`;
                    avatar.alt = user.profileName || user.username;
                    avatar.className = 'friend-avatar';
                    avatar.style.width = '56px';
                    avatar.style.height = '56px';
                    avatar.style.borderRadius = '50%';
                    avatar.style.border = '3px solid #ffe066';
                    avatar.style.boxShadow = '0 0 0 4px #1ec87822';
                    avatar.style.objectFit = 'cover';
                    // Level badge (overlaid)
                    const badge = document.createElement('span');
                    badge.className = 'level-badge';
                    badge.textContent = user.level || 1;
                    badge.style.position = 'absolute';
                    badge.style.bottom = '0';
                    badge.style.right = '0';
                    badge.style.transform = 'translate(30%, 30%)';
                    badge.style.background = 'linear-gradient(135deg, #ffe066 60%, #fffbe6 100%)';
                    badge.style.color = '#333';
                    badge.style.border = '1.5px solid #fff';
                    badge.style.width = '1.4rem';
                    badge.style.height = '1.4rem';
                    badge.style.display = 'flex';
                    badge.style.alignItems = 'center';
                    badge.style.justifyContent = 'center';
                    badge.style.borderRadius = '50%';
                    badge.style.fontWeight = 'bold';
                    badge.style.fontSize = '0.85rem';
                    badge.style.boxShadow = '0 1px 4px #ffe06677';
                    badge.style.zIndex = '2';
                    badge.style.letterSpacing = '0.01em';
                    badge.style.textShadow = '0 1px 0 #fff';
                    avatarWrap.appendChild(avatar);
                    avatarWrap.appendChild(badge);
                    // Info
                    const info = document.createElement('div');
                    info.className = 'friend-info';
                    info.style.flex = '1';
                    // Name
                    const name = document.createElement('h3');
                    name.textContent = user.profileName || user.username;
                    name.style.marginBottom = '0.3rem';
                    name.style.fontWeight = 'bold';
                    name.style.fontSize = '1rem';
                    name.style.letterSpacing = '0.01em';
                    name.style.color = '#1ec878';
                    name.style.textShadow = '0 1px 4px #1ec87822, 0 1px 0 #fff';
                    info.appendChild(name);
                    // XP
                    const xp = document.createElement('span');
                    xp.className = 'friend-xp';
                    xp.textContent = `${user.exp || 0} XP`;
                    xp.style.display = 'block';
                    xp.style.marginBottom = '0.3rem';
                    xp.style.fontWeight = '500';
                    xp.style.fontSize = '0.92rem';
                    xp.style.color = '#666';
                    info.appendChild(xp);
                    // XP progress bar
                    const xpBar = document.createElement('div');
                    xpBar.className = 'xp-bar';
                    xpBar.style.height = '8px';
                    xpBar.style.width = '100px';
                    xpBar.style.background = '#e0e0e0';
                    xpBar.style.borderRadius = '4px';
                    xpBar.style.marginBottom = '0.3rem';
                    xpBar.style.position = 'relative';
                    xpBar.title = 'XP to next level';
                    const fill = document.createElement('div');
                    const xpValue = user.exp || 0;
                    fill.style.height = '100%';
                    fill.style.width = Math.min(100, Math.round((xpValue % 1000) / 10)) + '%';
                    fill.style.background = 'linear-gradient(90deg, #1ec878, #ffe066)';
                    fill.style.borderRadius = '4px';
                    fill.style.transition = 'width 0.5s';
                    xpBar.appendChild(fill);
                    info.appendChild(xpBar);
                    // Add button
                    const addBtn = document.createElement('button');
                    addBtn.className = 'btn btn-primary add-friend-btn';
                    addBtn.textContent = 'Add';
                    addBtn.style.background = 'linear-gradient(90deg, #1ec878, #39e6a0)';
                    addBtn.style.color = '#fff';
                    addBtn.style.fontWeight = 'bold';
                    addBtn.style.border = 'none';
                    addBtn.style.borderRadius = '999px';
                    addBtn.style.padding = '0.4rem 1.2rem';
                    addBtn.style.marginLeft = '1rem';
                    addBtn.style.fontSize = '0.98rem';
                    addBtn.style.boxShadow = '0 2px 8px #1ec87822';
                    addBtn.style.cursor = 'pointer';
                    addBtn.style.transition = 'background 0.2s, transform 0.2s';
                    addBtn.addEventListener('mouseenter', () => {
                        if (!addBtn.disabled) {
                            addBtn.style.background = 'linear-gradient(90deg, #39e6a0, #1ec878)';
                            addBtn.style.transform = 'scale(1.07)';
                        }
                    });
                    addBtn.addEventListener('mouseleave', () => {
                        if (!addBtn.disabled) {
                            addBtn.style.background = 'linear-gradient(90deg, #1ec878, #39e6a0)';
                            addBtn.style.transform = 'scale(1)';
                        }
                    });
                    addBtn.addEventListener('click', () => {
                        addBtn.textContent = 'Request Sent!';
                        addBtn.disabled = true;
                        addBtn.style.background = '#ccc';
                        addBtn.style.transform = 'scale(1)';
                    });
                    // Assemble
                    card.appendChild(avatarWrap);
                    card.appendChild(info);
                    card.appendChild(addBtn);
                    searchResults.appendChild(card);
                });
            } catch (err) {
                searchResults.innerHTML = '<div class="no-results">Error searching users.</div>';
            }
        });
    }
});
