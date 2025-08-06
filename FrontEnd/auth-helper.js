// Enhanced Authentication Helper for Protected Pages
// Include this script in all protected pages

(function() {
    'use strict';
    
    // Prevent multiple authentication checks from running simultaneously
    let authCheckInProgress = false;
    let authCheckPromise = null;
    let authCheckCompleted = false;
    
    // Check authentication on page load
    async function checkAuth() {
        // Prevent multiple simultaneous auth checks
        if (authCheckInProgress) {
            console.log('Authentication check already in progress, waiting...');
            return authCheckPromise;
        }
        
        // If auth check already completed successfully, don't check again
        if (authCheckCompleted) {
            console.log('Authentication already verified, skipping check');
            return true;
        }
        
        authCheckInProgress = true;
        authCheckPromise = performAuthCheck();
        
        try {
            const result = await authCheckPromise;
            if (result) {
                authCheckCompleted = true;
            }
            return result;
        } finally {
            authCheckInProgress = false;
        }
    }
    
    async function performAuthCheck() {
        const redirectToLogin = () => {
            console.log('Redirecting to login page');
            // Add a small delay to prevent rapid redirects
            setTimeout(() => {
                window.location.href = '/Login/login.html';
            }, 100);
        };
        
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
            return true;
        } catch (error) {
            console.error('Authentication check error:', error);
            // On error, don't immediately redirect - give it another chance
            // This prevents logout on temporary network issues
            return true;
        }
    }
    
    // Debounced function to prevent rapid successive calls
    let debounceTimer = null;
    function debouncedCheckAuth() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            checkAuth();
        }, 100);
    }
    
    // Run authentication check when DOM is ready, but with a small delay
    // to ensure all scripts are loaded
    function initializeAuth() {
        // Small delay to ensure TokenManager is available
        setTimeout(() => {
            checkAuth();
        }, 50);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuth);
    } else {
        // If DOM is already loaded, run with a small delay
        initializeAuth();
    }
    
    // Set up periodic token validation (every 5 minutes)
    // Use a more robust interval that doesn't interfere with page loads
    let periodicCheckInterval = null;
    
    function startPeriodicCheck() {
        if (periodicCheckInterval) {
            clearInterval(periodicCheckInterval);
        }
        
        periodicCheckInterval = setInterval(async () => {
            if (typeof TokenManager !== 'undefined' && TokenManager.isTokenValid()) {
                try {
                    await TokenManager.validateToken();
                } catch (error) {
                    console.warn('Periodic token validation failed:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    // Start periodic check after initial auth check
    setTimeout(startPeriodicCheck, 1000);
    
    // Handle page visibility changes (when user switches tabs/windows)
    let visibilityCheckTimeout = null;
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && typeof TokenManager !== 'undefined') {
            // Clear any existing timeout
            if (visibilityCheckTimeout) {
                clearTimeout(visibilityCheckTimeout);
            }
            
            // Add a small delay to prevent rapid checks
            visibilityCheckTimeout = setTimeout(() => {
                if (!TokenManager.isTokenValid()) {
                    window.location.href = '/Login/login.html';
                }
            }, 500);
        }
    });
    
    // Handle beforeunload to clean up
    window.addEventListener('beforeunload', () => {
        if (periodicCheckInterval) {
            clearInterval(periodicCheckInterval);
        }
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        if (visibilityCheckTimeout) {
            clearTimeout(visibilityCheckTimeout);
        }
    });
    
    // Handle page focus events (when user returns to the tab)
    window.addEventListener('focus', () => {
        // Only check if the page has been visible for a while
        setTimeout(() => {
            if (document.hasFocus() && typeof TokenManager !== 'undefined') {
                debouncedCheckAuth();
            }
        }, 1000);
    });
    
    // Expose checkAuth function globally for manual calls if needed
    window.checkAuth = checkAuth;
    
})(); 