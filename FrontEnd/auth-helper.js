// Robust Authentication Helper for Protected Pages
// Include this script in all protected pages

(function() {
    'use strict';
    
    let authChecked = false;
    let authCheckAttempts = 0;
    const maxAttempts = 10;
    
    // Wait for TokenManager to be available
    function waitForTokenManager() {
        return new Promise((resolve) => {
            if (typeof TokenManager !== 'undefined') {
                resolve();
                return;
            }
            
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof TokenManager !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= 50) { // Wait up to 5 seconds
                    clearInterval(checkInterval);
                    console.error('TokenManager not available after 5 seconds');
                    resolve(); // Resolve anyway to prevent hanging
                }
            }, 100);
        });
    }
    
    // Simple authentication check
    async function checkAuth() {
        // Only check once per page load
        if (authChecked) {
            console.log('Authentication already checked, skipping');
            return true;
        }
        
        authCheckAttempts++;
        console.log(`Checking authentication (attempt ${authCheckAttempts})...`);
        
        // Wait for TokenManager to be available
        await waitForTokenManager();
        
        // Check if TokenManager is available
        if (typeof TokenManager === 'undefined') {
            console.error('TokenManager not found after waiting. Make sure config.js is loaded before auth-helper.js');
            if (authCheckAttempts >= maxAttempts) {
                redirectToLogin();
                return false;
            }
            // Retry after a short delay
            setTimeout(checkAuth, 500);
            return false;
        }
        
        // Check if token exists and is not expired
        if (!TokenManager.isTokenValid()) {
            console.log('Token not found or expired');
            if (authCheckAttempts >= maxAttempts) {
                redirectToLogin();
                return false;
            }
            // Retry after a short delay
            setTimeout(checkAuth, 500);
            return false;
        }
        
        // Validate token with server
        try {
            console.log('Validating token with server...');
            const isValid = await TokenManager.validateToken();
            if (!isValid) {
                console.log('Token validation failed');
                if (authCheckAttempts >= maxAttempts) {
                    redirectToLogin();
                    return false;
                }
                // Retry after a short delay
                setTimeout(checkAuth, 1000);
                return false;
            }
            
            console.log('Authentication check passed');
            authChecked = true;
            return true;
        } catch (error) {
            console.error('Authentication check error:', error);
            if (authCheckAttempts >= maxAttempts) {
                // On final attempt, assume token is still valid to prevent false logouts
                console.log('Max attempts reached, assuming token is valid');
                authChecked = true;
                return true;
            }
            // Retry after a short delay
            setTimeout(checkAuth, 1000);
            return false;
        }
    }
    
    function redirectToLogin() {
        console.log('Redirecting to login page');
        window.location.href = '/Login/login.html';
    }
    
    // Run authentication check when DOM is ready, with a delay to ensure scripts are loaded
    function initializeAuth() {
        // Add a delay to ensure all scripts are loaded
        setTimeout(() => {
            checkAuth();
        }, 200);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuth);
    } else {
        // If DOM is already loaded, run with a delay
        initializeAuth();
    }
    
    // Expose checkAuth function globally for manual calls if needed
    window.checkAuth = checkAuth;
    
})(); 