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
    // jwt-decode must be loaded via CDN in the HTML
    try {
        const decoded = window.jwt_decode ? window.jwt_decode(token) : null;
        if (!decoded || !decoded.exp) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        // exp is in seconds since epoch
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        // Token is valid, allow access
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
});

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

            const userData = JSON.parse(localStorage.getItem('userData'));
            console.log('userData:', userData);  // Add this to debug
            const userId = userData?._id;
            console.log('userId:', userId);      // Add this to verify
            
            
            if (userId) {
                
                
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
                
                syncFoodLogWithBackend(userId, foodLog);
            }
        }
    } catch (error) {
        console.error('Error adding food:', error);
        showError('Failed to add food. Please try again.');
    }
}

// Function to sync food log with backend
async function syncFoodLogWithBackend(userId, foodLog) {
    try {
        await fetch('http://localhost:8000/api/foodentry/add', {
            
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, foodLog })
        });
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
        <button class="btn btn-danger delete-meal-btn" onclick="deleteMeal(${meal.id})">×</button>
    `;
    
    mealsList.appendChild(mealItem);
}

// Delete meal
function deleteMeal(mealId) {
    currentMeals = currentMeals.filter(meal => meal.id !== mealId);
    updateDailyTotals();
    updateSummary();
    saveMeals();
    refreshMealsUI();
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
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Quantity select change handler
document.addEventListener('change', function(e) {
    if (e.target.id === 'quantity-select' && selectedFood) {
        showNutritionalPreview();
    }
});