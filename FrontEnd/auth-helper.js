// Simple Authentication Helper for Protected Pages
// Include this script in all protected pages

(function() {
    'use strict';
    
    // Check authentication on page load
    async function checkAuth() {
        const redirectToLogin = () => {
            console.log('Redirecting to login page');
            window.location.href = '/Login/login.html';
        };
        
        // Check if TokenManager is available
        if (typeof TokenManager === 'undefined') {
            console.error('TokenManager not found. Make sure config.js is loaded before auth-helper.js');
            redirectToLogin();
            return;
        }
        
        // Check if token exists and is not expired
        if (!TokenManager.isTokenValid()) {
            console.log('Token not found or expired');
            redirectToLogin();
            return;
        }
        
        // Validate token with server
        const isValid = await TokenManager.validateToken();
        if (!isValid) {
            console.log('Token validation failed');
            redirectToLogin();
            return;
        }
        
        console.log('Authentication check passed');
    }
    
    // Run authentication check when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }
    
    // Set up periodic token validation (every 5 minutes)
    setInterval(async () => {
        if (typeof TokenManager !== 'undefined' && TokenManager.isTokenValid()) {
            await TokenManager.validateToken();
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Handle page visibility changes (when user switches tabs/windows)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && typeof TokenManager !== 'undefined') {
            // When page becomes visible, check token validity
            if (!TokenManager.isTokenValid()) {
                window.location.href = '/Login/login.html';
            }
        }
    });
    
    // Handle beforeunload to clean up if needed
    window.addEventListener('beforeunload', () => {
        // Optional: Add any cleanup logic here
    });
    
})(); 