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
});
