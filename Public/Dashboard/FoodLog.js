// --- JWT Auth Check (Protected Page) ---
(function() {
    const redirectToLogin = () => {
        window.location.href = '/Public/test/login.html';
    };
    const token = localStorage.getItem('authToken');
    if (!token) {
        redirectToLogin();
        return;
    }
    try {
        const decoded = window.jwt_decode ? window.jwt_decode(token) : null;
        if (!decoded || !decoded.exp) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
    } catch (e) {
        localStorage.removeItem('authToken');
        redirectToLogin();
    }
})();

// Nutritionix API credentials
const appId = 'ee23efb0';
const appKey = 'bae6d2d56c1d0cccd180c07d68bf8936';

// Global variables
let selectedFood = null;
let currentMeals = [];
let dailyTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
};

// DOM elements
let searchInput, autocompleteList, quantitySelect, addButton, summarySection, mealsList;

// Initialize the food logger
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    loadStoredMeals();
    updateSummary();
    setupModal();
    
    // Debug: Check authentication state
    checkAuthState();
    
    // Run migration to clean up old food logs
    migrateFoodLogs();
});

// Debug function to check authentication state
function checkAuthState() {
    console.log('=== Authentication Debug ===');
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    console.log('Auth token exists:', !!token);
    console.log('User data exists:', !!userData);
    
    if (userData) {
        try {
            const parsed = JSON.parse(userData);
            console.log('User data structure:', parsed);
            console.log('User ID in userData:', parsed._id);
        } catch (e) {
            console.error('Error parsing userData:', e);
        }
    }
    
    if (token) {
        try {
            const decoded = window.jwt_decode(token);
            console.log('JWT decoded:', decoded);
            console.log('User ID in JWT:', decoded._id);
        } catch (e) {
            console.error('Error decoding JWT:', e);
        }
    }
    console.log('=== End Debug ===');
}

// Migrate old food logs to add userId
async function migrateFoodLogs() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No auth token found for migration');
            return;
        }
        
        const response = await fetch('http://localhost:8000/api/foodentry/migrate-foodlogs', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Food logs migration completed:', result);
        } else {
            console.log('Food logs migration not needed or failed');
        }
    } catch (error) {
        console.log('Migration error (non-critical):', error);
    }
}

function initializeElements() {
    searchInput = document.getElementById('food-search');
    autocompleteList = document.getElementById('autocomplete-list');
    quantitySelect = document.getElementById('quantity-select');
    addButton = document.getElementById('add-food-btn');
    summarySection = document.querySelector('.summary-section');
    mealsList = document.querySelector('.meal-list');
}

function setupEventListeners() {
    // Search input with debouncing
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (this.value.length >= 2) {
                searchFoods(this.value);
            } else {
                hideAutocomplete();
            }
        }, 300);
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !autocompleteList.contains(e.target)) {
            hideAutocomplete();
        }
    });

    // Add food button
    addButton.addEventListener('click', addFoodToLog);
    
    // Clear all meals button
    const clearAllBtn = document.getElementById('clear-all-meals-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (currentMeals.length === 0) {
                showError('No meals to clear');
                return;
            }
            
            const confirmed = confirm('Are you sure you want to clear all meals? This action cannot be undone.');
            if (confirmed) {
                await clearAllMeals();
            }
        });
    }
}

// Setup modal functionality
function setupModal() {
    const showLoggerBtn = document.getElementById('show-logger-btn');
    const closeLoggerBtn = document.getElementById('close-logger-btn');
    const modal = document.getElementById('food-logger-modal');

    showLoggerBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        searchInput.focus();
    });

    closeLoggerBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resetForm();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetForm();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            resetForm();
        }
    });
}

// Search foods using Nutritionix API
async function searchFoods(query) {
    try {
        const response = await fetch('https://trackapi.nutritionix.com/v2/search/instant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': appId,
                'x-app-key': appKey
            },
            body: JSON.stringify({
                query: query,
                detailed: true
            })
        });

        const data = await response.json();
        displayAutocomplete(data.common.concat(data.branded));
    } catch (error) {
        console.error('Error searching foods:', error);
        showError('Failed to search foods. Please try again.');
    }
}

// Display autocomplete suggestions
function displayAutocomplete(foods) {
    autocompleteList.innerHTML = '';
    
    if (foods.length === 0) {
        autocompleteList.innerHTML = '<div class="autocomplete-item no-results">No foods found</div>';
        autocompleteList.style.display = 'block';
        return;
    }

    foods.slice(0, 8).forEach(food => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = `
            <span class="food-name">${food.food_name}</span>
            <span class="food-brand">${food.brand_name || 'Generic'}</span>
        `;
        
        item.addEventListener('click', () => selectFood(food));
        autocompleteList.appendChild(item);
    });
    
    autocompleteList.style.display = 'block';
}

// Hide autocomplete list
function hideAutocomplete() {
    autocompleteList.style.display = 'none';
}

// Select a food from autocomplete
function selectFood(food) {
    selectedFood = food;
    searchInput.value = food.food_name;
    hideAutocomplete();
    
    // Enable quantity select and add button
    quantitySelect.disabled = false;
    addButton.disabled = false;
    
    // Show nutritional preview
    showNutritionalPreview();
}

// Show nutritional preview for selected food
async function showNutritionalPreview() {
    if (!selectedFood) return;
    
    try {
        const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': appId,
                'x-app-key': appKey
            },
            body: JSON.stringify({
                query: `1 ${quantitySelect.value} ${selectedFood.food_name}`
            })
        });

        const data = await response.json();
        if (data.foods && data.foods.length > 0) {
            const food = data.foods[0];
            updateNutritionalPreview(food);
        }
    } catch (error) {
        console.error('Error fetching nutritional data:', error);
    }
}

// Update nutritional preview display
function updateNutritionalPreview(food) {
    const preview = document.getElementById('nutritional-preview');
    if (preview) {
        preview.innerHTML = `
            <div class="nutritional-info">
                <h4>Nutritional Info (${quantitySelect.value})</h4>
                <div class="nutrition-grid">
                    <div class="nutrition-item">
                        <span class="label">Calories:</span>
                        <span class="value">${Math.round(food.nf_calories)}</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="label">Protein:</span>
                        <span class="value">${Math.round(food.nf_protein)}g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="label">Carbs:</span>
                        <span class="value">${Math.round(food.nf_total_carbohydrate)}g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="label">Fat:</span>
                        <span class="value">${Math.round(food.nf_total_fat)}g</span>
                    </div>
                </div>
            </div>
        `;
        preview.style.display = 'block';
    }
}

// Add food to log
async function addFoodToLog() {
    if (!selectedFood || !quantitySelect.value) {
        showError('Please select a food and quantity');
        return;
    }

    try {
        const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': appId,
                'x-app-key': appKey
            },
            body: JSON.stringify({
                query: `1 ${quantitySelect.value} ${selectedFood.food_name}`
            })
        });

        const data = await response.json();
        if (data.foods && data.foods.length > 0) {
            const food = data.foods[0];
            const meal = {
                id: Date.now(),
                name: selectedFood.food_name,
                brand: selectedFood.brand_name || 'Generic',
                quantity: quantitySelect.value,
                calories: Math.round(food.nf_calories),
                protein: Math.round(food.nf_protein),
                carbs: Math.round(food.nf_total_carbohydrate),
                fat: Math.round(food.nf_total_fat),
                timestamp: new Date().toISOString()
            };

            currentMeals.push(meal);
            updateDailyTotals();
            addMealToUI(meal);
            updateSummary();
            saveMeals();
            resetForm();
            
            // Add XP for logging a meal
            if (typeof addUserXP === 'function') {
                addUserXP(20, 'Food logged');
            }

            // Try to get userId from userData first, then from JWT token
            let userId = null;
            const userData = JSON.parse(localStorage.getItem('userData'));
            console.log('userData:', userData);
            
            if (userData && userData._id) {
                userId = userData._id;
                console.log('userId from userData:', userId);
            } else {
                // Fallback: extract userId from JWT token
                const token = localStorage.getItem('authToken');
                if (token) {
                    try {
                        const decoded = window.jwt_decode(token);
                        userId = decoded._id;
                        console.log('userId from JWT:', userId);
                    } catch (error) {
                        console.error('Error decoding JWT:', error);
                    }
                }
            }
            
            if (!userId) {
                console.error('No userId found in userData or JWT token');
                showError('User authentication error. Please log in again.');
                return;
            }
            
            const foodLog = {
                date: new Date().toISOString().slice(0, 10),
                calories: dailyTotals.calories,
                protein: dailyTotals.protein,
                carbs: dailyTotals.carbs,
                fat: dailyTotals.fat,
                meals: currentMeals.map(meal => ({
                    name: meal.name,
                    items: [meal.name], // or meal.items if you have more details
                    totalCalories: meal.calories
                }))
            };
            
            syncFoodLogWithBackend(foodLog);
        }
    } catch (error) {
        console.error('Error adding food:', error);
        showError('Failed to add food. Please try again.');
    }
}

// Function to delete food log from backend
async function deleteFoodLogFromBackend(foodLogId) {
    try {
        console.log('Deleting food log from backend:', foodLogId);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return false;
        }
        
        const response = await fetch(`http://localhost:8000/api/foodentry/delete/${foodLogId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('Food log deleted successfully:', result);
            // Remove the stored foodLogId
            localStorage.removeItem('currentFoodLogId');
            
            // Refresh smart quest UI if dashboard is available
            if (window.dashboard && window.dashboard.refreshSmartQuestData) {
                await window.dashboard.refreshSmartQuestData();
                window.dashboard.updateSmartQuestUI();
            }
            return true;
        } else {
            console.error('Failed to delete food log:', result.error);
            return false;
        }
    } catch (err) {
        console.error('Failed to delete food log from backend:', err);
        return false;
    }
}

// Function to sync food log with backend
async function syncFoodLogWithBackend(foodLog) {
    try {
        console.log('Syncing food log with backend:', { foodLog });
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }
        
        const response = await fetch('http://localhost:8000/api/foodentry/add', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ foodLog })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('Food log synced successfully:', result);
            
            // Store the backend foodLogId for later deletion
            if (result.foodLogId) {
                localStorage.setItem('currentFoodLogId', result.foodLogId);
                console.log('Stored foodLogId for deletion:', result.foodLogId);
            }
            
            // Show success message
            showSuccess('Food logged successfully!');
            
            // Refresh dashboard data if available
            if (window.refreshDashboardData) {
                window.refreshDashboardData();
            }
            // Refresh smart quest UI if dashboard is available
            if (window.dashboard && window.dashboard.refreshSmartQuestData) {
                await window.dashboard.refreshSmartQuestData();
                window.dashboard.updateSmartQuestUI();
            }
        } else {
            console.error('Failed to sync food log:', result.error);
            showError(`Failed to sync food log: ${result.error}`);
        }
    } catch (err) {
        console.error('Failed to sync food log with backend:', err);
    }
}


// Update daily totals
function updateDailyTotals() {
    dailyTotals = currentMeals.reduce((totals, meal) => {
        totals.calories += meal.calories;
        totals.protein += meal.protein;
        totals.carbs += meal.carbs;
        totals.fat += meal.fat;
        return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

// Add meal to UI
function addMealToUI(meal) {
    const mealItem = document.createElement('div');
    mealItem.className = 'meal-item';
    mealItem.innerHTML = `
        <span class="meal-icon">🍽️</span>
        <div class="meal-content">
            <h3>${meal.name}</h3>
            <p>${meal.brand} - ${meal.quantity}</p>
            <span class="calories">${meal.calories} calories</span>
            <div class="meal-macros">
                <span class="macro">P: ${meal.protein}g</span>
                <span class="macro">C: ${meal.carbs}g</span>
                <span class="macro">F: ${meal.fat}g</span>
            </div>
        </div>
        <button class="btn btn-danger delete-meal-btn" onclick="deleteMealAsync(${meal.id})">×</button>
    `;
    
    mealsList.appendChild(mealItem);
}

// Delete meal
async function deleteMeal(mealId) {
    currentMeals = currentMeals.filter(meal => meal.id !== mealId);
    updateDailyTotals();
    updateSummary();
    saveMeals();
    refreshMealsUI();
    
    // If no meals left, delete the food log from backend
    if (currentMeals.length === 0) {
        const foodLogId = localStorage.getItem('currentFoodLogId');
        if (foodLogId) {
            console.log('No meals left, deleting food log from backend');
            const deleted = await deleteFoodLogFromBackend(foodLogId);
            if (deleted) {
                console.log('Food log deleted from backend successfully');
            } else {
                console.error('Failed to delete food log from backend');
            }
        }
    }
}

// Async wrapper for deleteMeal
async function deleteMealAsync(mealId) {
    await deleteMeal(mealId);
}

// Refresh meals UI
function refreshMealsUI() {
    mealsList.innerHTML = '';
    currentMeals.forEach(meal => addMealToUI(meal));
}

// Update summary section
function updateSummary() {
    const targetCalories = 2000;
    const targetProtein = 100;
    const targetCarbs = 300;
    const targetFat = 75;

    const caloriesRemaining = Math.max(0, targetCalories - dailyTotals.calories);
    const proteinRemaining = Math.max(0, targetProtein - dailyTotals.protein);
    const carbsRemaining = Math.max(0, targetCarbs - dailyTotals.carbs);
    const fatRemaining = Math.max(0, targetFat - dailyTotals.fat);

    // Update progress bars
    updateProgressBar('calories', dailyTotals.calories, targetCalories, caloriesRemaining);
    updateProgressBar('protein', dailyTotals.protein, targetProtein, proteinRemaining);
    updateProgressBar('carbs', dailyTotals.carbs, targetCarbs, carbsRemaining);
    updateProgressBar('fat', dailyTotals.fat, targetFat, fatRemaining);
}

// Update individual progress bar
function updateProgressBar(type, current, target, remaining) {
    const percentage = Math.min((current / target) * 100, 100);
    const progressFill = document.querySelector(`[data-type="${type}"] .progress-fill`);
    const progressText = document.querySelector(`[data-type="${type}"] .progress-text`);
    const remainingText = document.querySelector(`[data-type="${type}"] .remaining`);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${current}/${target}`;
    if (remainingText) remainingText.textContent = `Remaining: ${remaining}`;
}

// Reset form
function resetForm() {
    searchInput.value = '';
    selectedFood = null;
    quantitySelect.disabled = true;
    addButton.disabled = true;
    hideAutocomplete();
    
    const preview = document.getElementById('nutritional-preview');
    if (preview) preview.style.display = 'none';
}

// Clear all meals and delete from backend
async function clearAllMeals() {
    const foodLogId = localStorage.getItem('currentFoodLogId');
    if (foodLogId) {
        console.log('Clearing all meals, deleting food log from backend');
        const deleted = await deleteFoodLogFromBackend(foodLogId);
        if (deleted) {
            console.log('Food log deleted from backend successfully');
        }
    }
    
    currentMeals = [];
    updateDailyTotals();
    updateSummary();
    saveMeals();
    refreshMealsUI();
}

// Save meals to localStorage
function saveMeals() {
    localStorage.setItem('foodLogMeals', JSON.stringify(currentMeals));
}

// Load meals from localStorage
function loadStoredMeals() {
    const stored = localStorage.getItem('foodLogMeals');
    if (stored) {
        currentMeals = JSON.parse(stored);
        refreshMealsUI();
        updateDailyTotals();
        updateSummary();
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    }, 4000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Quantity select change handler
document.addEventListener('change', function(e) {
    if (e.target.id === 'quantity-select' && selectedFood) {
        showNutritionalPreview();
    }
});

// After logging food and updating UI, sync steps quest
if (typeof syncStepsQuestAfterFoodLog === 'function') {
  // Replace with actual step count value if available
  const newStepCount = 0; // TODO: get from UI or user input
  syncStepsQuestAfterFoodLog(newStepCount);
}