// Environment-specific href configuration
// This file handles different base paths for development and production environments

const HREF_CONFIG = {
    // Environment detection
    isDevelopment: () => {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' || 
               window.location.hostname.includes('localhost');
    },
    
    // Base paths for different environments
    ENVIRONMENTS: {
        DEVELOPMENT: {
            BASE_PATH: '',  // Served from root in development
            API_URL: 'http://localhost:8000'
        },
        PRODUCTION: {
            BASE_PATH: '/fitness',  // Adjust this based on your production setup
            API_URL: 'https://fitness-ewwi.onrender.com'
        }
    },
    
    // Get current environment configuration
    getCurrentConfig: function() {
        return this.isDevelopment() ? this.ENVIRONMENTS.DEVELOPMENT : this.ENVIRONMENTS.PRODUCTION;
    },
    
    // Detect current folder depth
    getCurrentFolderDepth: function() {
        const path = window.location.pathname;
        // Count slashes to determine depth
        const depth = (path.match(/\//g) || []).length - 1;
        return Math.max(0, depth);
    },
    
    // Route definitions - target paths from FrontEnd root
    ROUTES: {
        HOME: 'index.html',
        SIGNUP: 'Signup/Signup.html',
        LOGIN: 'Login/login.html',
        DASHBOARD: 'Dashboard/dashboard.html',
        FOOD_SUGGESTION: 'FoodSuggestion/FoodSuggestion.html',
        NOTIFICATIONS: 'Notifications/Notifications.html',
        SUPPORT: 'Support/Support.html',
        HELP_SUPPORT: 'HelpSupport/HelpSupport.html',
        
        // Dashboard sub-routes
        DASHBOARD_SETTINGS: 'Dashboard/Settings.html',
        DASHBOARD_POSTURE: 'Dashboard/Posture.html',
        DASHBOARD_FOOD_LOG: 'Dashboard/FoodLog.html',
        DASHBOARD_BUDDIES: 'Dashboard/Buddies.html',
        
        // Ongoing routes
        ONGOING_1: 'ongoing/ongoing1/ongoing.html',
        ONGOING_2: 'ongoing/ongoing2/ongoing2.html',
        ONGOING_3: 'ongoing/ongoing3/ongoing3.html',
        ONGOING_4: 'ongoing/ongoing4/ongoing4.html'
    },
    
    // Generate environment-aware href
    getHref: function(routeKey) {
        const isDev = this.isDevelopment();
        const route = this.ROUTES[routeKey];
        
        if (!route) {
            console.warn(`Route key '${routeKey}' not found in HREF_CONFIG.ROUTES`);
            return routeKey; // Return as-is if not found
        }
        
        // For development, generate relative path based on current folder depth
        if (isDev) {
            const depth = this.getCurrentFolderDepth();
            if (depth === 0) {
                // We're in the root (FrontEnd) directory
                return route;
            } else {
                // We're in a subfolder, need to go back to root first
                const backPath = '../'.repeat(depth);
                return backPath + route;
            }
        }
        
        // For production, apply base path if needed
        const config = this.getCurrentConfig();
        const cleanRoute = route.startsWith('/') ? route.substring(1) : route;
        const basePath = config.BASE_PATH;
        
        if (basePath && basePath !== '') {
            return `${basePath}/${cleanRoute}`;
        }
        
        return '/' + route;
    },
    
    // Get API URL for current environment
    getApiUrl: function(endpoint = '') {
        const config = this.getCurrentConfig();
        return config.API_URL + endpoint;
    },
    
    // Navigate to a route using environment-aware href
    navigateTo: function(routeKey) {
        const href = this.getHref(routeKey);
        window.location.href = href;
    },
    
    // Update all links on the page to use environment-aware hrefs
    updatePageLinks: function() {
        try {
            console.log('🔄 Starting to update page links...');
            
            // Only update links in development environment
            if (!this.isDevelopment()) {
                console.log('Production environment detected, skipping link updates');
                return;
            }
            
            // Update navigation links with more specific selectors
            const linkMappings = {
                'a[href="/index.html"]': 'HOME',
                'a[href="/Home/home.html"]': 'HOME',
                'a[href="/Signup/Signup.html"]': 'SIGNUP',
                'a[href="/Login/login.html"]': 'LOGIN',
                'a[href="/Dashboard/dashboard.html"]': 'DASHBOARD',
                'a[href="/FoodSuggestion/FoodSuggestion.html"]': 'FOOD_SUGGESTION',
                'a[href="/Notifications/Notifications.html"]': 'NOTIFICATIONS',
                'a[href="/Support/Support.html"]': 'SUPPORT',
                'a[href="/HelpSupport/HelpSupport.html"]': 'HELP_SUPPORT',
                'a[href="/Dashboard/Settings.html"]': 'DASHBOARD_SETTINGS',
                'a[href="/Dashboard/Posture.html"]': 'DASHBOARD_POSTURE',
                'a[href="/Dashboard/FoodLog.html"]': 'DASHBOARD_FOOD_LOG',
                'a[href="/Dashboard/Buddies.html"]': 'DASHBOARD_BUDDIES',
                'a[href="/ongoing/ongoing1/ongoing.html"]': 'ONGOING_1',
                'a[href="/ongoing/ongoing2/ongoing2.html"]': 'ONGOING_2',
                'a[href="/ongoing/ongoing3/ongoing3.html"]': 'ONGOING_3',
                'a[href="/ongoing/ongoing4/ongoing4.html"]': 'ONGOING_4'
            };
            
            let updatedCount = 0;
            
            // Update each link type
            Object.entries(linkMappings).forEach(([selector, routeKey]) => {
                const elements = document.querySelectorAll(selector);
                console.log(`Found ${elements.length} elements for selector: ${selector}`);
                
                elements.forEach(element => {
                    const oldHref = element.getAttribute('href');
                    const newHref = this.getHref(routeKey);
                    element.setAttribute('href', newHref);
                    console.log(`Updated link: ${oldHref} → ${newHref}`);
                    updatedCount++;
                });
            });
            
            // Handle special cases like home.html#features
            const featureLinks = document.querySelectorAll('a[href="/Home/home.html#features"]');
            featureLinks.forEach(link => {
                const homeHref = this.getHref('HOME');
                const oldHref = link.getAttribute('href');
                const newHref = homeHref + '#features';
                link.setAttribute('href', newHref);
                console.log(`Updated feature link: ${oldHref} → ${newHref}`);
                updatedCount++;
            });
            
            console.log(`✅ Updated ${updatedCount} links for current environment`);
        } catch (error) {
            console.error('⚠️ Error updating page links:', error);
        }
    },
    
    // Initialize href configuration
    init: function() {
        // Update links when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updatePageLinks());
        } else {
            this.updatePageLinks();
        }
        
        // Log current environment
        const config = this.getCurrentConfig();
        console.log('🌍 Environment:', this.isDevelopment() ? 'Development' : 'Production');
        console.log('📍 Base Path:', config.BASE_PATH || '/');
        console.log('🔗 API URL:', config.API_URL);
    }
};

// Auto-initialize when script loads
HREF_CONFIG.init();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HREF_CONFIG;
}

// Make available globally
window.HREF_CONFIG = HREF_CONFIG;
