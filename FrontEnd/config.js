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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, getApiUrl };
} 