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
});
