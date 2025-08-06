// API Configuration
const API_CONFIG = {
    // Change this URL when deploying
    // Local development: 'http://localhost:8000'
    // Production: 'https://your-app-name.onrender.com'
    BASE_URL: 'https://fitness-ewwi.onrender.com',
    
    // API endpoints
    ENDPOINTS: {
        LOGIN: '/api/login',
        REGISTER: '/api/createUser',
        VALIDATE_TOKEN: '/api/validateToken',
        GET_USER: '/api/getUser',
        UPDATE_USER: '/api/updateUser',
        FOOD_ENTRY: '/api/foodentry',
        ACTIVITIES: '/api/activities',
        NOTIFICATIONS: '/api/notifications',
        FRIEND_REQUEST: '/api/respondFriendRequest',
        SEND_FRIEND_REQUEST: '/api/sendFriendRequest',
        REJECT_ALL_FRIENDS: '/api/rejectAllFriendRequests',
        SEARCH_USERS: '/api/searchUsers',
        RANK: '/api/rank'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}

// Enhanced Token Manager for better cross-device compatibility and race condition prevention
const TokenManager = {
    // Track ongoing validation to prevent race conditions
    _validationPromise: null,
    _lastValidationTime: 0,
    _validationCooldown: 1000, // Reduced to 1 second cooldown
    _lastSuccessfulValidation: 0,
    _cachedValidationResult: null,
    
    // Get token with fallback
    getToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    },
    
    // Set token in both storages for redundancy
    setToken(token) {
        localStorage.setItem('authToken', token);
        sessionStorage.setItem('authToken', token);
        // Store timestamp for expiration checking
        const timestamp = Date.now();
        localStorage.setItem('tokenTimestamp', timestamp);
        sessionStorage.setItem('tokenTimestamp', timestamp);
        
        // Reset validation state when setting new token
        this._validationPromise = null;
        this._lastValidationTime = 0;
        this._lastSuccessfulValidation = 0;
        this._cachedValidationResult = null;
    },
    
    // Remove token from both storages
    removeToken() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('tokenTimestamp');
        sessionStorage.removeItem('tokenTimestamp');
        
        // Reset validation state
        this._validationPromise = null;
        this._lastValidationTime = 0;
        this._lastSuccessfulValidation = 0;
        this._cachedValidationResult = null;
    },
    
    // Check if token exists and is not too old (24 hours)
    isTokenValid() {
        const token = this.getToken();
        if (!token) return false;
        
        const timestamp = localStorage.getItem('tokenTimestamp') || sessionStorage.getItem('tokenTimestamp');
        if (!timestamp) return false;
        
        // Check if token is older than 24 hours
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        return tokenAge < maxAge;
    },
    
    // Validate token with server (with retry and race condition prevention)
    async validateToken(retries = 2) {
        const token = this.getToken();
        if (!token) return false;
        
        // Check cooldown to prevent excessive API calls
        const now = Date.now();
        const timeSinceLastValidation = now - this._lastValidationTime;
        
        // If we have a recent successful validation, use cached result
        if (this._cachedValidationResult && (now - this._lastSuccessfulValidation) < 30000) { // 30 seconds cache
            console.log('Using cached validation result');
            return this._cachedValidationResult;
        }
        
        // If there's already a validation in progress, wait for it
        if (this._validationPromise) {
            console.log('Validation already in progress, waiting...');
            return this._validationPromise;
        }
        
        // Check if we're in cooldown period
        if (timeSinceLastValidation < this._validationCooldown) {
            // During cooldown, if we have a cached result, use it
            if (this._cachedValidationResult !== null) {
                console.log('In cooldown, using cached result');
                return this._cachedValidationResult;
            }
            // If no cached result, wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, this._validationCooldown - timeSinceLastValidation));
        }
        
        // Start new validation
        this._lastValidationTime = now;
        this._validationPromise = this._performValidation(token, retries);
        
        try {
            const result = await this._validationPromise;
            // Cache successful validations
            if (result) {
                this._cachedValidationResult = true;
                this._lastSuccessfulValidation = now;
            }
            return result;
        } finally {
            // Clear the promise after a short delay to allow for concurrent calls
            setTimeout(() => {
                this._validationPromise = null;
            }, 100);
        }
    },
    
    // Internal method to perform the actual validation
    async _performValidation(token, retries) {
        for (let i = 0; i <= retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                const response = await fetch(getApiUrl('/api/validateToken'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    return true;
                } else if (response.status === 401 || response.status === 403) {
                    // Token is invalid, remove it and clear cache
                    this.removeToken();
                    this._cachedValidationResult = false;
                    return false;
                }
            } catch (error) {
                console.warn(`Token validation attempt ${i + 1} failed:`, error);
                if (i === retries) {
                    // On final retry, if it's a network error, assume token is still valid
                    // This prevents logout on temporary network issues
                    return true;
                }
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
        return false;
    },
    
    // Force refresh validation (bypasses cooldown)
    async forceValidateToken() {
        this._validationPromise = null;
        this._lastValidationTime = 0;
        this._cachedValidationResult = null;
        return this.validateToken();
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, getApiUrl, TokenManager };
} 