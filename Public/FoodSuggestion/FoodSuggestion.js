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
class MealQuestApp {
    constructor() {
        this.apiKey = '1d2f130e-a701-457d-8120-18d7ed2734f1';
        this.userPreferences = {};
        this.searchResults = [];
        this.mealPlan = [];
        this.selectedPlanType = 'foods';
        this.selectedDuration = 7;
        this.questProgress = 0;
        this.currentUser = null;
        
        this.init();
    }

    init() {
        this.loadUserData();
        this.loadUserPreferences();
        this.setupEventListeners();
        this.updateQuestProgress();
        this.loadSampleData();
    }

    loadUserData() {
        try {
            // Get user data from localStorage
            const userData = localStorage.getItem('currentUser');
            const authToken = localStorage.getItem('authToken');
            
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.updateProfileDisplay();
                console.log('User data loaded from localStorage:', this.currentUser);
            } else if (authToken) {
                // If no user data but token exists, try to fetch from server
                this.fetchUserDataFromServer();
            } else {
                // Use default data if no user data found
                this.currentUser = {
                    fullName: 'John Doe',
                    avatar: 'avator.jpeg',
                    level: 1,
                    exp: 0,
                    coins: 0
                };
                this.updateProfileDisplay();
                console.log('Using default user data');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to default data
            this.currentUser = {
                fullName: 'John Doe',
                avatar: 'avator.jpeg',
                level: 1,
                exp: 0,
                coins: 0
            };
            this.updateProfileDisplay();
        }
    }

    async fetchUserDataFromServer() {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) return;

            // Decode JWT token to get user email
            const decoded = jwt_decode(authToken);
            const userEmail = decoded.email;

            const response = await fetch(`http://localhost:8000/api/getUser/${userEmail}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData;
                localStorage.setItem('currentUser', JSON.stringify(userData));
                this.updateProfileDisplay();
                console.log('User data fetched from server:', userData);
            } else {
                console.error('Failed to fetch user data from server');
            }
        } catch (error) {
            console.error('Error fetching user data from server:', error);
        }
    }

    updateProfileDisplay() {
        if (!this.currentUser) return;

        // Update avatar
        const avatarImg = document.querySelector('.sidebar .avatar');
        if (avatarImg) {
            avatarImg.src = `../../assets/${this.currentUser.avatar || 'avator1.jpeg'}`;
            avatarImg.alt = `${this.currentUser.profileName || this.currentUser.fullName || 'User'} Avatar`;
        }

        // Update user name - use profileName first, then fallback to fullName
        const userName = document.querySelector('.sidebar .user-name');
        if (userName) {
            userName.textContent = this.currentUser.profileName || this.currentUser.fullName || 'John Doe';
        }

        // Update level badge
        const levelBadge = document.querySelector('.sidebar .level-badge');
        if (levelBadge) {
            levelBadge.textContent = `Level ${this.currentUser.level || 1}`;
        }

        // Update coin balance
        const coinBalance = document.querySelector('.coin-balance');
        if (coinBalance) {
            coinBalance.textContent = this.currentUser.coins || 0;
        }

        // Update quest progress based on user's meal history
        this.updateQuestProgressFromUserData();
    }

    updateQuestProgressFromUserData() {
        // Calculate quest progress based on user's meal history or other metrics
        if (this.currentUser) {
            // You can customize this logic based on your app's requirements
            const mealHistory = this.currentUser.mealHistory || [];
            const completedMeals = mealHistory.length;
            
            // Update quest progress (0-100)
            this.questProgress = Math.min(completedMeals * 10, 100);
            
            // Update progress circle
            const progressCircle = document.getElementById('questProgress');
            if (progressCircle) {
                const circumference = 2 * Math.PI * 25; // r=25
                const offset = circumference - (this.questProgress / 100) * circumference;
                progressCircle.style.strokeDashoffset = offset;
            }

            // Update progress number
            const progressNumber = document.querySelector('.progress-number');
            if (progressNumber) {
                progressNumber.textContent = Math.floor(this.questProgress / 10);
            }
        }
    }

    loadUserPreferences() {
        // Load user preferences from localStorage or default values
        const storedPrefs = localStorage.getItem('userPreferences');
        if (storedPrefs) {
            this.userPreferences = JSON.parse(storedPrefs);
        } else {
            // Default preferences based on onboarding data or current user data
            this.userPreferences = {
                dietType: this.currentUser?.dietType || 'Balanced',
                goal: this.currentUser?.primaryGoal || 'Muscle Gain',
                allergies: this.currentUser?.allergies?.join(', ') || 'None',
                calorieRange: this.calculateCalorieRange(),
                activityLevel: this.currentUser?.activityLevel || 'moderate',
                age: this.currentUser?.age || 28,
                gender: this.currentUser?.gender || 'Female',
                height: this.currentUser?.height || 170,
                weight: this.currentUser?.weight || 65
            };
        }
        
        this.updateFilterDisplay();
    }

    calculateCalorieRange() {
        if (!this.currentUser) return '2000-2500';
        
        // Basic calorie calculation based on user data
        const { age, gender, height, weight, activityLevel } = this.currentUser;
        
        if (!age || !gender || !height || !weight) return '2000-2500';
        
        // BMR calculation using Mifflin-St Jeor Equation
        let bmr;
        if (gender.toLowerCase() === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        
        // Activity multiplier
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9
        };
        
        const multiplier = activityMultipliers[activityLevel] || 1.55;
        const dailyCalories = Math.round(bmr * multiplier);
        
        return `${dailyCalories - 200}-${dailyCalories + 200}`;
    }

    updateFilterDisplay() {
        const dietTypeEl = document.getElementById('dietType');
        const userGoalEl = document.getElementById('userGoal');
        const userAllergiesEl = document.getElementById('userAllergies');
        const calorieRangeEl = document.getElementById('calorieRange');
        
        if (dietTypeEl) dietTypeEl.textContent = this.userPreferences.dietType;
        if (userGoalEl) userGoalEl.textContent = this.userPreferences.goal;
        if (userAllergiesEl) userAllergiesEl.textContent = this.userPreferences.allergies;
        if (calorieRangeEl) calorieRangeEl.textContent = this.userPreferences.calorieRange;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('foodSearch');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // Suggestion chips
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (searchInput) {
                    const food = chip.dataset.food;
                    searchInput.value = food;
                    this.performSearch();
                }
            });
        });

        // Filter cards
        document.querySelectorAll('.filter-card').forEach(card => {
            card.addEventListener('click', () => {
                this.toggleFilter(card);
            });
        });

        // Plan configuration
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectPlanType(btn);
            });
        });

        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectDuration(btn);
            });
        });

        // Generate plan button
        const generateBtn = document.getElementById('generatePlanBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateMealPlan();
            });
        }

        // Plan actions
        const saveBtn = document.querySelector('.save-btn');
        const shareBtn = document.querySelector('.share-btn');
        const regenerateBtn = document.querySelector('.regenerate-btn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveMealPlan();
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareMealPlan();
            });
        }

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.generateMealPlan();
            });
        }

        // Tip cards
        document.querySelectorAll('.tip-card').forEach(card => {
            card.addEventListener('click', () => {
                this.unlockTip(card);
            });
        });

        // Listen for storage changes to update profile when user data changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser' || e.key === 'authToken') {
                this.loadUserData();
            }
        });

        // Add profile update functionality
        this.setupProfileUpdateListeners();
    }

    setupProfileUpdateListeners() {
        // Add click listener to avatar for potential avatar change
        const avatarImg = document.querySelector('.sidebar .avatar');
        if (avatarImg) {
            avatarImg.addEventListener('click', () => {
                this.showProfileUpdateModal();
            });
        }

        // Add click listener to user name for potential name change
        const userName = document.querySelector('.sidebar .user-name');
        if (userName) {
            userName.addEventListener('click', () => {
                this.showProfileUpdateModal();
            });
        }
    }

    showProfileUpdateModal() {
        // Create a simple modal for profile updates
        const modal = document.createElement('div');
        modal.className = 'profile-update-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Update Profile</h3>
                <div class="form-group">
                    <label>Profile Name:</label>
                    <input type="text" id="newProfileName" value="${this.currentUser?.profileName || this.currentUser?.fullName || ''}" placeholder="Enter profile name">
                </div>
                <div class="form-group">
                    <label>Avatar:</label>
                    <select id="newAvatar">
                        <option value="avator1.jpeg" ${this.currentUser?.avatar === 'avator1.jpeg' ? 'selected' : ''}>Avatar 1</option>
                        <option value="avator2.jpeg" ${this.currentUser?.avatar === 'avator2.jpeg' ? 'selected' : ''}>Avatar 2</option>
                        <option value="avator3.jpeg" ${this.currentUser?.avatar === 'avator3.jpeg' ? 'selected' : ''}>Avatar 3</option>
                        <option value="avator4.jpeg" ${this.currentUser?.avatar === 'avator4.jpeg' ? 'selected' : ''}>Avatar 4</option>
                        <option value="avator5.jpeg" ${this.currentUser?.avatar === 'avator5.jpeg' ? 'selected' : ''}>Avatar 5</option>
                        <option value="avator6.jpeg" ${this.currentUser?.avatar === 'avator6.jpeg' ? 'selected' : ''}>Avatar 6</option>
                        <option value="avator7.jpeg" ${this.currentUser?.avatar === 'avator7.jpeg' ? 'selected' : ''}>Avatar 7</option>
                        <option value="avator8.jpeg" ${this.currentUser?.avatar === 'avator8.jpeg' ? 'selected' : ''}>Avatar 8</option>
                        <option value="avator9.jpeg" ${this.currentUser?.avatar === 'avator9.jpeg' ? 'selected' : ''}>Avatar 9</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.profile-update-modal').remove()">Cancel</button>
                    <button class="btn-primary" onclick="mealQuest.updateProfile()">Save Changes</button>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .profile-update-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .modal-content {
                background: white;
                padding: 20px;
                border-radius: 10px;
                min-width: 300px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            .form-group input, .form-group select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .modal-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            .btn-primary, .btn-secondary {
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .btn-primary {
                background: #007bff;
                color: white;
            }
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    }

    async updateProfile() {
        const newProfileName = document.getElementById('newProfileName').value.trim();
        const newAvatar = document.getElementById('newAvatar').value;
        
        if (!newProfileName) {
            this.showNotification('Profile name cannot be empty!', 'error');
            return;
        }

        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                this.showNotification('Authentication required!', 'error');
                return;
            }

            const updateData = {
                profileName: newProfileName,
                avatar: newAvatar
            };

            const response = await fetch('http://localhost:8000/api/updateUser', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                
                // Update local storage
                this.currentUser = updatedUser;
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                
                // Update display
                this.updateProfileDisplay();
                
                // Close modal
                document.querySelector('.profile-update-modal').remove();
                
                this.showNotification('Profile updated successfully!', 'success');
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Failed to update profile. Please try again.', 'error');
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('foodSearch');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        if (!query) return;

        this.showLoading(true);
        
        try {
            // Simulate API call with sample data
            await this.simulateApiCall(1000);
            
            const results = await this.getSearchResults(query);
            this.displaySearchResults(results);
            this.updateQuestProgress();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('Search failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async getSearchResults(query) {
        try {
            // Fetch real recipes from DummyJSON API
            const response = await fetch('https://dummyjson.com/recipes');
            const data = await response.json();
            
            if (!data.recipes || !Array.isArray(data.recipes)) {
                console.error('Invalid API response format');
                return this.getFallbackSearchResults(query);
            }

            // Filter recipes based on query and user preferences
            const filteredRecipes = data.recipes.filter(recipe => {
                const matchesQuery = recipe.name.toLowerCase().includes(query.toLowerCase()) ||
                                   recipe.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
                                   recipe.cuisine.toLowerCase().includes(query.toLowerCase());
                
                // Apply user preference filters
                const matchesDiet = this.matchesDietaryPreferences(recipe);
                const matchesGoal = this.matchesGoalPreferences(recipe);
                
                return matchesQuery && matchesDiet && matchesGoal;
            });

            // Transform API data to match our format
            return filteredRecipes.map(recipe => ({
                id: recipe.id,
                name: recipe.name,
                description: `${recipe.cuisine} cuisine - ${recipe.difficulty} difficulty`,
                calories: recipe.caloriesPerServing,
                protein: this.calculateProteinFromIngredients(recipe.ingredients),
                carbs: this.calculateCarbsFromIngredients(recipe.ingredients),
                fat: this.calculateFatFromIngredients(recipe.ingredients),
                image: recipe.image,
                category: recipe.mealType[0]?.toLowerCase() || 'main',
                tags: recipe.tags,
                cuisine: recipe.cuisine,
                difficulty: recipe.difficulty,
                prepTime: recipe.prepTimeMinutes,
                cookTime: recipe.cookTimeMinutes,
                servings: recipe.servings,
                rating: recipe.rating,
                reviewCount: recipe.reviewCount,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                mealType: recipe.mealType
            }));

        } catch (error) {
            console.error('Error fetching recipes from API:', error);
            return this.getFallbackSearchResults(query);
        }
    }

    // Fallback search results if API fails
    getFallbackSearchResults(query) {
        const sampleFoods = [
            {
                id: 1,
                name: 'Grilled Chicken Breast',
                description: 'Lean protein source perfect for muscle building',
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.6,
                image: '🍗',
                category: 'protein',
                tags: ['chicken', 'protein', 'lean', 'muscle'],
                cuisine: 'American',
                difficulty: 'Easy',
                prepTime: 10,
                cookTime: 20,
                servings: 2,
                rating: 4.5,
                reviewCount: 25
            },
            {
                id: 2,
                name: 'Salmon with Vegetables',
                description: 'Omega-3 rich fish with steamed vegetables',
                calories: 280,
                protein: 34,
                carbs: 8,
                fat: 12,
                image: '🐟',
                category: 'protein',
                tags: ['salmon', 'fish', 'omega3', 'vegetables'],
                cuisine: 'Mediterranean',
                difficulty: 'Medium',
                prepTime: 15,
                cookTime: 25,
                servings: 2,
                rating: 4.7,
                reviewCount: 18
            },
            {
                id: 3,
                name: 'Quinoa Bowl',
                description: 'Complete protein grain with mixed vegetables',
                calories: 220,
                protein: 8,
                carbs: 39,
                fat: 4,
                image: '🌾',
                category: 'grain',
                tags: ['quinoa', 'grain', 'protein', 'vegetarian'],
                cuisine: 'Mediterranean',
                difficulty: 'Easy',
                prepTime: 20,
                cookTime: 15,
                servings: 2,
                rating: 4.3,
                reviewCount: 12
            }
        ];

        return sampleFoods.filter(food => {
            const matchesQuery = food.name.toLowerCase().includes(query.toLowerCase()) ||
                               food.tags.some(tag => tag.includes(query.toLowerCase()));
            
            const matchesDiet = this.matchesDietaryPreferences(food);
            const matchesGoal = this.matchesGoalPreferences(food);
            
            return matchesQuery && matchesDiet && matchesGoal;
        });
    }

    // Helper functions to calculate macros from ingredients (simplified)
    calculateProteinFromIngredients(ingredients) {
        const proteinKeywords = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'tofu', 'eggs', 'cheese', 'yogurt', 'milk'];
        const proteinCount = ingredients.filter(ingredient => 
            proteinKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
        ).length;
        return Math.min(proteinCount * 8, 40); // Simplified calculation
    }

    calculateCarbsFromIngredients(ingredients) {
        const carbKeywords = ['rice', 'pasta', 'bread', 'potato', 'quinoa', 'flour', 'sugar', 'honey', 'fruit'];
        const carbCount = ingredients.filter(ingredient => 
            carbKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
        ).length;
        return Math.min(carbCount * 15, 60); // Simplified calculation
    }

    calculateFatFromIngredients(ingredients) {
        const fatKeywords = ['oil', 'butter', 'cheese', 'cream', 'avocado', 'nuts', 'seeds'];
        const fatCount = ingredients.filter(ingredient => 
            fatKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
        ).length;
        return Math.min(fatCount * 5, 25); // Simplified calculation
    }

    matchesDietaryPreferences(food) {
        const { dietType, allergies } = this.userPreferences;
        
        // Check allergies
        if (allergies !== 'None') {
            const allergyList = allergies.toLowerCase().split(',');
            if (allergyList.some(allergy => food.tags.includes(allergy.trim()))) {
                return false;
            }
        }
        
        // Check diet type
        switch (dietType.toLowerCase()) {
            case 'vegetarian':
                return !food.tags.includes('meat') && !food.tags.includes('fish');
            case 'vegan':
                return !food.tags.includes('meat') && !food.tags.includes('fish') && !food.tags.includes('dairy');
            case 'keto':
                return food.carbs < 10;
            case 'low-carb':
                return food.carbs < 20;
            default:
                return true;
        }
    }

    matchesGoalPreferences(food) {
        const { goal } = this.userPreferences;
        
        switch (goal.toLowerCase()) {
            case 'muscle gain':
                return food.protein >= 20;
            case 'weight loss':
                return food.calories < 200;
            case 'maintenance':
                return true;
            default:
                return true;
        }
    }

    displaySearchResults(results) {
        const resultsGrid = document.getElementById('resultsGrid');
        const resultsCount = document.getElementById('resultsCount');
        
        if (resultsCount) {
            resultsCount.textContent = results.length;
        }
        
        if (!resultsGrid) return;
        
        if (results.length === 0) {
            resultsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-light); margin-bottom: 20px;"></i>
                    <h3>No recipes found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        
        resultsGrid.innerHTML = results.map(food => `
            <div class="meal-card" data-food-id="${food.id}">
                <div class="meal-image">
                    ${food.image && food.image.startsWith('http') ? 
                        `<img src="${food.image}" alt="${food.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                         <span style="font-size: 4rem; display: none;">🍽️</span>` :
                        `<span style="font-size: 4rem;">${food.image}</span>`
                    }
                </div>
                <div class="meal-content">
                    <div class="meal-header">
                        <h3 class="meal-title">${food.name}</h3>
                        <div class="meal-rating">
                            <span class="stars">${'★'.repeat(Math.floor(food.rating || 0))}${'☆'.repeat(5 - Math.floor(food.rating || 0))}</span>
                            <span class="rating-text">${food.rating || 0} (${food.reviewCount || 0} reviews)</span>
                        </div>
                    </div>
                    <p class="meal-description">${food.description}</p>
                    <div class="meal-meta">
                        <span class="cuisine-badge">${food.cuisine}</span>
                        <span class="difficulty-badge ${food.difficulty?.toLowerCase()}">${food.difficulty}</span>
                        <span class="time-badge">${food.prepTime + food.cookTime} min</span>
                    </div>
                    <div class="meal-stats">
                        <div class="meal-stat">
                            <i class="fas fa-fire"></i>
                            <span>${food.calories} cal</span>
                        </div>
                        <div class="meal-stat">
                            <i class="fas fa-dumbbell"></i>
                            <span>${food.protein}g protein</span>
                        </div>
                        <div class="meal-stat">
                            <i class="fas fa-bread-slice"></i>
                            <span>${food.carbs}g carbs</span>
                        </div>
                        <div class="meal-stat">
                            <i class="fas fa-users"></i>
                            <span>${food.servings} servings</span>
                        </div>
                    </div>
                    <div class="meal-tags">
                        ${food.tags?.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
                    </div>
                    <div class="meal-actions">
                        <button class="meal-btn primary" onclick="mealQuest.addToPlan(${food.id})">
                            <i class="fas fa-plus"></i>
                            <span>Add to Plan</span>
                        </button>
                        <button class="meal-btn secondary" onclick="mealQuest.viewDetails(${food.id})">
                            <i class="fas fa-info-circle"></i>
                            <span>Details</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.searchResults = results;
    }

    selectPlanType(btn) {
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedPlanType = btn.dataset.type;
    }

    selectDuration(btn) {
        document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDuration = parseInt(btn.dataset.days);
    }

    async generateMealPlan() {
        this.showLoading(true);
        
        try {
            // Simulate AI processing
            await this.simulateApiCall(2000);
            
            const plan = await this.createMealPlan();
            this.displayMealPlan(plan);
            this.showNotification('Meal plan generated successfully!', 'success');
            this.updateQuestProgress();
            
        } catch (error) {
            console.error('Plan generation error:', error);
            this.showNotification('Failed to generate meal plan. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async createMealPlan() {
        const plan = [];
        let availableFoods = [...this.searchResults];
        
        if (availableFoods.length === 0) {
            // Fetch more recipes if no search results
            try {
                const response = await fetch('https://dummyjson.com/recipes');
                const data = await response.json();
                if (data.recipes && Array.isArray(data.recipes)) {
                    availableFoods = data.recipes.map(recipe => ({
                        id: recipe.id,
                        name: recipe.name,
                        description: `${recipe.cuisine} cuisine - ${recipe.difficulty} difficulty`,
                        calories: recipe.caloriesPerServing,
                        protein: this.calculateProteinFromIngredients(recipe.ingredients),
                        carbs: this.calculateCarbsFromIngredients(recipe.ingredients),
                        fat: this.calculateFatFromIngredients(recipe.ingredients),
                        image: recipe.image,
                        category: recipe.mealType[0]?.toLowerCase() || 'main',
                        tags: recipe.tags,
                        cuisine: recipe.cuisine,
                        difficulty: recipe.difficulty,
                        prepTime: recipe.prepTimeMinutes,
                        cookTime: recipe.cookTimeMinutes,
                        servings: recipe.servings,
                        rating: recipe.rating,
                        reviewCount: recipe.reviewCount,
                        ingredients: recipe.ingredients,
                        instructions: recipe.instructions,
                        mealType: recipe.mealType
                    }));
                }
            } catch (error) {
                console.error('Error fetching recipes for meal plan:', error);
                availableFoods = this.getFallbackSearchResults('');
            }
        }
        
        for (let day = 1; day <= this.selectedDuration; day++) {
            const dayPlan = {
                day: day,
                meals: {
                    breakfast: this.selectMealForTime(availableFoods, 'breakfast'),
                    lunch: this.selectMealForTime(availableFoods, 'lunch'),
                    dinner: this.selectMealForTime(availableFoods, 'dinner'),
                    snack: this.selectMealForTime(availableFoods, 'snack')
                }
            };
            plan.push(dayPlan);
        }
        
        return plan;
    }

    selectMealForTime(availableFoods, mealTime) {
        const timePreferences = {
            breakfast: ['breakfast', 'dairy', 'grain', 'smoothie', 'pancake', 'waffle', 'oatmeal'],
            lunch: ['lunch', 'protein', 'vegetables', 'grain', 'salad', 'sandwich', 'soup'],
            dinner: ['dinner', 'protein', 'vegetables', 'pasta', 'rice', 'meat', 'fish'],
            snack: ['snack', 'dairy', 'fruits', 'nuts', 'dessert', 'cookie', 'smoothie']
        };
        
        const preferredTags = timePreferences[mealTime] || [];
        const suitableFoods = availableFoods.filter(food => 
            preferredTags.some(tag => 
                food.tags?.some(foodTag => foodTag.toLowerCase().includes(tag.toLowerCase())) ||
                food.mealType?.some(type => type.toLowerCase().includes(tag.toLowerCase())) ||
                food.name.toLowerCase().includes(tag.toLowerCase())
            )
        );
        
        if (suitableFoods.length === 0) {
            return availableFoods[Math.floor(Math.random() * availableFoods.length)];
        }
        
        return suitableFoods[Math.floor(Math.random() * suitableFoods.length)];
    }

    displayMealPlan(plan) {
        const planDisplay = document.getElementById('planDisplay');
        const planContent = document.getElementById('planContent');
        const totalCalories = document.getElementById('totalCalories');
        const totalProtein = document.getElementById('totalProtein');
        const planDuration = document.getElementById('planDuration');
        
        if (!planDisplay || !planContent) return;
        
        // Calculate totals
        let totalCals = 0;
        let totalProt = 0;
        
        plan.forEach(day => {
            Object.values(day.meals).forEach(meal => {
                totalCals += meal.calories;
                totalProt += meal.protein;
            });
        });
        
        if (totalCalories) totalCalories.textContent = totalCals.toLocaleString();
        if (totalProtein) totalProtein.textContent = totalProt.toLocaleString();
        if (planDuration) planDuration.textContent = this.selectedDuration;
        
        // Generate plan HTML
        planContent.innerHTML = plan.map(day => `
            <div class="day-plan">
                <h4>Day ${day.day}</h4>
                <div class="meals-grid">
                    ${Object.entries(day.meals).map(([mealTime, meal]) => `
                        <div class="meal-slot">
                            <div class="meal-time">${mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}</div>
                            <div class="meal-item">
                                <div class="meal-icon">
                                    ${meal.image && meal.image.startsWith('http') ? 
                                        `<img src="${meal.image}" alt="${meal.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                         <span style="font-size: 2rem; display: none;">🍽️</span>` :
                                        `<span style="font-size: 2rem;">${meal.image}</span>`
                                    }
                                </div>
                                <div class="meal-info">
                                    <div class="meal-name">${meal.name}</div>
                                    <div class="meal-meta">
                                        <span class="meal-cuisine">${meal.cuisine}</span>
                                        <span class="meal-time-badge">${meal.prepTime + meal.cookTime} min</span>
                                    </div>
                                    <div class="meal-calories">${meal.calories} cal • ${meal.protein}g protein</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        planDisplay.style.display = 'block';
        planDisplay.scrollIntoView({ behavior: 'smooth' });
        
        this.mealPlan = plan;
    }

    addToPlan(foodId) {
        const food = this.searchResults.find(f => f.id === foodId);
        if (!food) return;
        
        // Add to meal plan logic
        this.showNotification(`${food.name} added to your plan!`, 'success');
        this.updateQuestProgress();
    }

    viewDetails(foodId) {
        const food = this.searchResults.find(f => f.id === foodId);
        if (!food) return;
        
        // Create detailed recipe modal
        const modal = document.createElement('div');
        modal.className = 'recipe-detail-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${food.name}</h3>
                    <button class="close-btn" onclick="this.closest('.recipe-detail-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="recipe-image">
                        ${food.image && food.image.startsWith('http') ? 
                            `<img src="${food.image}" alt="${food.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                             <span style="font-size: 4rem; display: none;">🍽️</span>` :
                            `<span style="font-size: 4rem;">${food.image}</span>`
                        }
                    </div>
                    <div class="recipe-info">
                        <div class="recipe-meta">
                            <div class="meta-item">
                                <i class="fas fa-star"></i>
                                <span>${food.rating || 0} (${food.reviewCount || 0} reviews)</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${food.prepTime + food.cookTime} min total</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-users"></i>
                                <span>${food.servings} servings</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-flag"></i>
                                <span>${food.cuisine}</span>
                            </div>
                        </div>
                        <div class="recipe-stats">
                            <div class="stat-item">
                                <span class="stat-value">${food.calories}</span>
                                <span class="stat-label">Calories</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${food.protein}g</span>
                                <span class="stat-label">Protein</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${food.carbs}g</span>
                                <span class="stat-label">Carbs</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${food.fat}g</span>
                                <span class="stat-label">Fat</span>
                            </div>
                        </div>
                        ${food.ingredients ? `
                        <div class="recipe-section">
                            <h4>Ingredients</h4>
                            <ul class="ingredients-list">
                                ${food.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        ${food.instructions ? `
                        <div class="recipe-section">
                            <h4>Instructions</h4>
                            <ol class="instructions-list">
                                ${food.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                            </ol>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="mealQuest.addToPlan(${food.id}); this.closest('.recipe-detail-modal').remove();">
                        <i class="fas fa-plus"></i> Add to Meal Plan
                    </button>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .recipe-detail-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }
            .recipe-detail-modal .modal-content {
                background: white;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            .recipe-detail-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
            }
            .recipe-detail-modal .modal-header h3 {
                margin: 0;
                color: var(--text-dark);
            }
            .recipe-detail-modal .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-light);
            }
            .recipe-detail-modal .modal-body {
                padding: 20px;
            }
            .recipe-image {
                text-align: center;
                margin-bottom: 20px;
            }
            .recipe-image img {
                max-width: 100%;
                max-height: 200px;
                border-radius: 10px;
            }
            .recipe-meta {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            .meta-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                color: var(--text-light);
            }
            .recipe-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 20px;
                padding: 15px;
                background: var(--bg-primary);
                border-radius: 10px;
            }
            .stat-item {
                text-align: center;
            }
            .stat-value {
                display: block;
                font-size: 1.2rem;
                font-weight: bold;
                color: var(--primary-color);
            }
            .stat-label {
                font-size: 0.8rem;
                color: var(--text-light);
            }
            .recipe-section {
                margin-bottom: 20px;
            }
            .recipe-section h4 {
                margin-bottom: 10px;
                color: var(--text-dark);
            }
            .ingredients-list, .instructions-list {
                padding-left: 20px;
            }
            .ingredients-list li, .instructions-list li {
                margin-bottom: 8px;
                line-height: 1.5;
            }
            .modal-actions {
                padding: 20px;
                border-top: 1px solid #eee;
                text-align: center;
            }
            .btn-primary {
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    }

    saveMealPlan() {
        if (this.mealPlan.length === 0) {
            this.showNotification('No meal plan to save!', 'error');
            return;
        }
        
        localStorage.setItem('savedMealPlan', JSON.stringify(this.mealPlan));
        this.showNotification('Meal plan saved successfully!', 'success');
    }

    shareMealPlan() {
        if (this.mealPlan.length === 0) {
            this.showNotification('No meal plan to share!', 'error');
            return;
        }
        
        // Simulate sharing
        this.showNotification('Sharing meal plan...', 'info');
        setTimeout(() => {
            this.showNotification('Meal plan shared successfully!', 'success');
        }, 1000);
    }

    unlockTip(card) {
        if (card.classList.contains('locked')) {
            card.classList.remove('locked');
            card.classList.add('unlocked');
            card.querySelector('.tip-icon i').className = 'fas fa-check-circle';
            this.updateTipsProgress();
            this.showNotification('Tip unlocked!', 'success');
        }
    }

    updateTipsProgress() {
        const unlockedTips = document.querySelectorAll('.tip-card.unlocked').length;
        const totalTips = document.querySelectorAll('.tip-card').length;
        const tipsCountEl = document.querySelector('.tips-count');
        if (tipsCountEl) {
            tipsCountEl.textContent = unlockedTips;
        }
    }

    toggleFilter(card) {
        card.classList.toggle('active');
        const status = card.querySelector('.filter-status');
        status.classList.toggle('active');
        
        // Re-filter results if we have search results
        if (this.searchResults.length > 0) {
            this.performSearch();
        }
    }

    updateQuestProgress() {
        this.questProgress += 10;
        if (this.questProgress > 100) this.questProgress = 100;
        
        const progressCircle = document.getElementById('questProgress');
        const progressNumber = document.querySelector('.progress-number');
        
        if (progressCircle) {
            const circumference = 2 * Math.PI * 25; // r=25
            const offset = circumference - (this.questProgress / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }
        
        if (progressNumber) {
            progressNumber.textContent = Math.floor(this.questProgress / 10);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        const progressFill = document.getElementById('loadingProgress');
        
        if (!overlay) return;
        
        if (show) {
            overlay.classList.add('show');
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 100) progress = 100;
                if (progressFill) {
                    progressFill.style.width = progress + '%';
                }
                
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 200);
        } else {
            overlay.classList.remove('show');
            if (progressFill) {
                progressFill.style.width = '0%';
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('successNotification');
        if (!notification) return;
        
        const content = notification.querySelector('.notification-content span');
        if (content) {
            content.textContent = message;
        }
        
        // Update notification style based on type
        notification.className = `success-notification ${type}`;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    async simulateApiCall(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    loadSampleData() {
        // Load some sample data on page load
        setTimeout(() => {
            this.updateTipsProgress();
        }, 500);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mealQuest = new MealQuestApp();
});

// Global functions for button clicks
function addToPlan(foodId) {
    if (window.mealQuest) {
        window.mealQuest.addToPlan(foodId);
    }
}

function viewDetails(foodId) {
    if (window.mealQuest) {
        window.mealQuest.viewDetails(foodId);
    }
}
