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

// Simple and Reliable Token Manager
const TokenManager = {
    // Simple cache for validation results
    _lastValidation: null,
    _validationCache: null,
    _isValidating: false,
    
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
        
        // Clear validation cache when setting new token
        this._validationCache = null;
        this._lastValidation = null;
        this._isValidating = false;
    },
    
    // Remove token from both storages
    removeToken() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('tokenTimestamp');
        sessionStorage.removeItem('tokenTimestamp');
        
        // Clear validation cache
        this._validationCache = null;
        this._lastValidation = null;
        this._isValidating = false;
    },
    
    // Check if token exists and is not too old (24 hours)
    isTokenValid() {
        const token = this.getToken();
        if (!token) {
            console.log('No token found');
            return false;
        }
        
        const timestamp = localStorage.getItem('tokenTimestamp') || sessionStorage.getItem('tokenTimestamp');
        if (!timestamp) {
            console.log('No token timestamp found');
            return false;
        }
        
        // Check if token is older than 24 hours
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        const isValid = tokenAge < maxAge;
        console.log(`Token age: ${Math.floor(tokenAge / (1000 * 60))} minutes, valid: ${isValid}`);
        return isValid;
    },
    
    // Simple and reliable token validation
    async validateToken() {
        const token = this.getToken();
        if (!token) {
            console.log('No token to validate');
            return false;
        }
        
        // Prevent multiple simultaneous validations
        if (this._isValidating) {
            console.log('Validation already in progress, waiting...');
            // Wait for current validation to complete
            while (this._isValidating) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this._validationCache;
        }
        
        // Check if we have a recent cached result (within 5 minutes)
        const now = Date.now();
        if (this._validationCache && this._lastValidation && (now - this._lastValidation) < 300000) {
            console.log('Using cached validation result');
            return this._validationCache;
        }
        
        this._isValidating = true;
        
        try {
            console.log('Validating token with server...');
            const response = await fetch(getApiUrl('/api/validateToken'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const isValid = response.ok;
            
            // Cache the result for 5 minutes
            this._validationCache = isValid;
            this._lastValidation = now;
            
            if (!isValid) {
                console.log('Token validation failed, removing token');
                this.removeToken();
            } else {
                console.log('Token validation successful');
            }
            
            return isValid;
        } catch (error) {
            console.warn('Token validation error:', error);
            // On network error, assume token is still valid to prevent false logouts
            // But don't cache this assumption
            return true;
        } finally {
            this._isValidating = false;
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, getApiUrl, TokenManager };
} 