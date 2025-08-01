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
    const userData = JSON.parse(localStorage.getItem('currentUser'));
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
    const requestItem = button.closest('.request-item');
    const email = requestItem && requestItem.getAttribute('data-email');
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!email || !userData) return;
    // Call backend to accept
    fetch('http://localhost:8000/api/respondFriendRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromEmail: email, toEmail: userData.email, action: 'accept' })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            // Remove from UI
            requestItem.style.opacity = '0';
            requestItem.style.transform = 'translateX(-100%)';
            setTimeout(() => { 
                requestItem.remove(); 
                // Refresh friends list and friend requests
                renderFriends();
                renderFriendRequests();
            }, 300);
        } else {
            button.textContent = 'Error';
        }
    }).catch(() => { button.textContent = 'Error'; });
}

// Friend request rejection functionality
function rejectRequest(button) {
    const requestItem = button.closest('.request-item');
    const email = requestItem && requestItem.getAttribute('data-email');
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!email || !userData) return;
    // Call backend to reject
    fetch('http://localhost:8000/api/respondFriendRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromEmail: email, toEmail: userData.email, action: 'reject' })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            // Remove from UI
            requestItem.style.opacity = '0';
            requestItem.style.transform = 'translateX(-100%)';
            setTimeout(() => { 
                requestItem.remove(); 
                // Refresh friends list and friend requests
                renderFriends();
                renderFriendRequests();
            }, 300);
        } else {
            button.textContent = 'Error';
        }
    }).catch(() => { button.textContent = 'Error'; });
}

// Reject all friend requests functionality
function rejectAllRequests() {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData || !userData.email) return;
    fetch('http://localhost:8000/api/rejectAllFriendRequests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: userData.email })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            // Remove all request items from UI
            const requestList = document.getElementById('request-list');
            if (requestList) requestList.innerHTML = '';
            // Disable the reject all button
            const rejectAllBtn = document.querySelector('.reject-all-btn');
            if (rejectAllBtn) {
                rejectAllBtn.disabled = true;
                rejectAllBtn.textContent = 'All Rejected';
            }
        }
    });
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

let myFriendEmails = new Set();

// Fetch and cache current user's friends on page load
async function fetchMyFriends() {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData || !userData.email) return;
    try {
        const res = await fetch(`http://localhost:8000/api/getUser/${encodeURIComponent(userData.email)}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        const user = await res.json();
        myFriendEmails = new Set((user.friends || []).map(f => f.email));
    } catch (err) {}
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
                    currentUser = JSON.parse(localStorage.getItem('currentUser'));
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
                    avatar.alt = user.profileName || user.fullName || user.username || 'User';
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
                    // Name (show real name for search results)
                    const name = document.createElement('h3');
                    const displayName = user.profileName || user.fullName || user.username || 'User';
                    name.textContent = displayName;
                    name.setAttribute('data-email', user.email);
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
                    let addBtn;
                    if (myFriendEmails.has(user.email)) {
                        addBtn = document.createElement('button');
                        addBtn.className = 'btn btn-secondary add-friend-btn';
                        addBtn.textContent = 'Added';
                        addBtn.disabled = true;
                        addBtn.style.background = '#ccc';
                        addBtn.style.color = '#666';
                        addBtn.style.fontWeight = 'bold';
                        addBtn.style.border = 'none';
                        addBtn.style.borderRadius = '999px';
                        addBtn.style.padding = '0.4rem 1.2rem';
                        addBtn.style.marginLeft = '1rem';
                        addBtn.style.fontSize = '0.98rem';
                        addBtn.style.boxShadow = '0 2px 8px #1ec87822';
                        addBtn.style.cursor = 'not-allowed';
                    } else {
                        // Check if we have a recent sent request (cooldown)
                        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                        if (currentUser && currentUser.sentFriendRequests) {
                            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
                            const recentRequest = currentUser.sentFriendRequests.find(
                                req => req.toEmail === user.email && req.sentAt > sixHoursAgo
                            );
                            if (recentRequest) {
                                addBtn = document.createElement('button');
                                addBtn.className = 'btn btn-secondary add-friend-btn';
                                addBtn.textContent = '6h Cooldown';
                                addBtn.disabled = true;
                                addBtn.style.background = '#ff6b6b';
                                addBtn.style.color = '#fff';
                                addBtn.style.fontWeight = 'bold';
                                addBtn.style.border = 'none';
                                addBtn.style.borderRadius = '999px';
                                addBtn.style.padding = '0.4rem 1.2rem';
                                addBtn.style.marginLeft = '1rem';
                                addBtn.style.fontSize = '0.98rem';
                                addBtn.style.boxShadow = '0 2px 8px #ff6b6b22';
                                addBtn.style.cursor = 'not-allowed';
                            } else {
                                addBtn = document.createElement('button');
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
                            }
                        } else {
                            addBtn = document.createElement('button');
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
                        }
                        
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
                        addBtn.addEventListener('click', async () => {
                            // Send friend request to backend
                            addBtn.textContent = 'Sending...';
                            addBtn.disabled = true;
                            addBtn.style.background = '#ccc';
                            addBtn.style.transform = 'scale(1)';
                            let currentUser = null;
                            try {
                                currentUser = JSON.parse(localStorage.getItem('currentUser'));
                            } catch (e) {}
                            if (!currentUser || !user.email) {
                                addBtn.textContent = 'Error';
                                return;
                            }
                            try {
                                const res = await fetch('http://localhost:8000/api/sendFriendRequest', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        toEmail: user.email,
                                        fromEmail: currentUser.email,
                                        fromProfileName: currentUser.profileName,
                                        fromAvatar: currentUser.avatar
                                    })
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                    addBtn.textContent = 'Request Sent!';
                                    addBtn.disabled = true;
                                    addBtn.style.background = '#ccc';
                                    addBtn.style.cursor = 'not-allowed';
                                } else {
                                    if (data.error && data.error.includes('6 hours')) {
                                        addBtn.textContent = '6h Cooldown';
                                        addBtn.disabled = true;
                                        addBtn.style.background = '#ff6b6b';
                                        addBtn.style.cursor = 'not-allowed';
                                        addBtn.title = data.error;
                                    } else {
                                        addBtn.textContent = data.error || 'Error';
                                    }
                                }
                            } catch (err) {
                                addBtn.textContent = 'Error';
                            }
                        });
                    }
                    // Assemble
                    card.appendChild(avatarWrap);
                    card.appendChild(info);
                    card.appendChild(addBtn);
                    searchResults.appendChild(card);
                });
                // Update cooldown status after displaying search results
                updateCooldownStatus();
            } catch (err) {
                searchResults.innerHTML = '<div class="no-results">Error searching users.</div>';
            }
        });
    }

    // Render real friends for the logged-in user
    async function renderFriends() {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (!userData || !userData.email) return;
        try {
            const res = await fetch(`http://localhost:8000/api/getUser/${encodeURIComponent(userData.email)}`);
            if (!res.ok) throw new Error('Failed to fetch user');
            const user = await res.json();
            const friends = user.friends || [];
            const friendsList = document.querySelector('.friends-list');
            if (!friendsList) return;
            friendsList.innerHTML = '';
            friends.forEach(friend => {
                const friendDiv = document.createElement('div');
                friendDiv.className = 'friend-item';
                friendDiv.innerHTML = `
                    <img src="../../assets/${friend.avatar || 'avator1.jpeg'}" alt="${friend.profileName || friend.email}" class="friend-avatar">
                    <div class="friend-info">
                        <h3>${friend.profileName || friend.email}</h3>
                        <span class="friend-level">Level ${friend.level || 1}</span>
                        <span class="friend-xp">${friend.exp || 0} XP</span>
                    </div>
                `;
                friendsList.appendChild(friendDiv);
            });
        } catch (err) {
            // Optionally show error
        }
    }
    renderFriends();

    // Check and update cooldown status for sent requests
    async function updateCooldownStatus() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.email) return;
        
        try {
            const res = await fetch(`http://localhost:8000/api/getUser/${encodeURIComponent(currentUser.email)}`);
            if (!res.ok) throw new Error('Failed to fetch user');
            const user = await res.json();
            
            // Check each search result for cooldown status
            const searchResultItems = document.querySelectorAll('.search-result-item');
            searchResultItems.forEach(item => {
                const addBtn = item.querySelector('.add-friend-btn');
                if (addBtn && addBtn.textContent === '6h Cooldown') {
                    const userEmail = item.querySelector('.friend-info h3').getAttribute('data-email');
                    if (userEmail) {
                        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
                        const sentRequest = user.sentFriendRequests && user.sentFriendRequests.find(
                            req => req.toEmail === userEmail && req.sentAt > sixHoursAgo
                        );
                        
                        if (!sentRequest) {
                            // Cooldown expired, reset button
                            addBtn.textContent = 'Add';
                            addBtn.disabled = false;
                            addBtn.style.background = 'linear-gradient(90deg, #1ec878, #39e6a0)';
                            addBtn.style.cursor = 'pointer';
                            addBtn.title = '';
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Error updating cooldown status:', err);
        }
    }

    // Render real friend requests for the logged-in user
    async function renderFriendRequests() {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (!userData || !userData.email) return;
        try {
            const res = await fetch(`http://localhost:8000/api/getUser/${encodeURIComponent(userData.email)}`);
            if (!res.ok) throw new Error('Failed to fetch user');
            const user = await res.json();
            const requests = user.friendRequests || [];
            const requestList = document.getElementById('request-list');
            if (!requestList) return;
            requestList.innerHTML = '';
            requests.filter(r => r.status === 'pending').forEach(req => {
                const reqDiv = document.createElement('div');
                reqDiv.className = 'request-item';
                reqDiv.setAttribute('data-email', req.fromEmail);
                reqDiv.innerHTML = `
                    <img src="../../assets/${req.fromAvatar || 'avator1.jpeg'}" alt="${req.fromProfileName || req.fromEmail}" class="request-avatar">
                    <div class="request-info">
                        <h3>${req.fromProfileName || req.fromEmail}</h3>
                        <span class="level-tag">Friend Request</span>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary accept-btn">Accept</button>
                        <button class="btn btn-danger reject-btn">Reject</button>
                    </div>
                `;
                reqDiv.querySelector('.accept-btn').addEventListener('click', function() { acceptRequest(this); });
                reqDiv.querySelector('.reject-btn').addEventListener('click', function() { rejectRequest(this); });
                requestList.appendChild(reqDiv);
            });
        } catch (err) {
            // Optionally show error
        }
    }
    renderFriendRequests();

    // Render leaderboard with pagination
    let leaderboardUsers = [];
    let leaderboardPage = 0;
    const USERS_PER_PAGE = 8;
    async function renderLeaderboard() {
        try {
            const res = await fetch('http://localhost:8000/api/getUser');
            if (!res.ok) throw new Error('Failed to fetch users');
            const users = await res.json();
            // Sort by XP descending
            leaderboardUsers = users.sort((a, b) => (b.exp || 0) - (a.exp || 0));
            leaderboardPage = 0;
            renderLeaderboardPage();
        } catch (err) {
            // Optionally show error
        }
    }
    function renderLeaderboardPage() {
        const tbody = document.getElementById('leaderboard-body');
        const nextBtn = document.querySelector('.leaderboard-next-btn');
        if (!tbody) return;
        tbody.innerHTML = '';
        const start = leaderboardPage * USERS_PER_PAGE;
        const end = start + USERS_PER_PAGE;
        const pageUsers = leaderboardUsers.slice(start, end);
        pageUsers.forEach((user, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${start + idx + 1}</td>
                <td class="user-cell">
                    <img src="../../assets/${user.avatar || 'avator1.jpeg'}" alt="${user.profileName || user.email}" class="small-avatar" style="width:32px;height:32px;border-radius:50%;margin-right:8px;vertical-align:middle;">
                    ${user.profileName || user.email}
                </td>
                <td>${user.level || 1}</td>
                <td>${user.exp || 0}</td>
            `;
            tbody.appendChild(tr);
        });
        // Show/hide next button
        if (leaderboardUsers.length > end) {
            nextBtn.style.display = '';
        } else {
            nextBtn.style.display = 'none';
        }
    }
    const nextBtn = document.querySelector('.leaderboard-next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            leaderboardPage++;
            renderLeaderboardPage();
        });
    }
    renderLeaderboard();
    fetchMyFriends();
    updateCooldownStatus();
});
