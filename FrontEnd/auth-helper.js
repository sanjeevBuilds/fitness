// Simple Authentication Helper for Protected Pages
// Include this script in all protected pages

(function() {
    'use strict';
    
    let authChecked = false;
    
    // Simple authentication check
    async function checkAuth() {
        // Only check once per page load
        if (authChecked) {
            return true;
        }
        
        console.log('Checking authentication...');
        
        // Check if TokenManager is available
        if (typeof TokenManager === 'undefined') {
            console.error('TokenManager not found. Make sure config.js is loaded before auth-helper.js');
            redirectToLogin();
            return false;
        }
        
        // Check if token exists and is not expired
        if (!TokenManager.isTokenValid()) {
            console.log('Token not found or expired');
            redirectToLogin();
            return false;
        }
        
        // Validate token with server
        try {
            const isValid = await TokenManager.validateToken();
            if (!isValid) {
                console.log('Token validation failed');
                redirectToLogin();
                return false;
            }
            
            console.log('Authentication check passed');
            authChecked = true;
            return true;
        } catch (error) {
            console.error('Authentication check error:', error);
            // On error, assume token is still valid to prevent false logouts
            authChecked = true;
            return true;
        }
    }
    
    function redirectToLogin() {
        console.log('Redirecting to login page');
        window.location.href = '/Login/login.html';
    }
    
    // Run authentication check when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        // If DOM is already loaded, run immediately
        checkAuth();
    }
    
    // Expose checkAuth function globally for manual calls if needed
    window.checkAuth = checkAuth;
    
})(); 