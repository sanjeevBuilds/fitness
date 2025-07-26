// Utility function to refresh dashboard data
// Include this script in your FoodLog page or other pages that modify data

function refreshDashboardData() {
    // Check if dashboard is available
    if (window.enhancedDashboard && typeof window.enhancedDashboard.refreshDashboardData === 'function') {
        window.enhancedDashboard.refreshDashboardData();
        console.log('Dashboard data refresh triggered');
    } else {
        console.log('Dashboard not available, will refresh on next page load');
    }
}

// Function to call after adding a food log
function onFoodLogAdded() {
    console.log('Food log added, refreshing dashboard...');
    refreshDashboardData();
}

// Function to call after updating steps
function onStepsUpdated() {
    console.log('Steps updated, refreshing dashboard...');
    refreshDashboardData();
}

// Function to call after completing a quest
function onQuestCompleted() {
    console.log('Quest completed, refreshing dashboard...');
    refreshDashboardData();
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        refreshDashboardData,
        onFoodLogAdded,
        onStepsUpdated,
        onQuestCompleted
    };
} 