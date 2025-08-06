// Test script to check protein and carbs data from all APIs
console.log('🧪 Testing Nutrition Data from All APIs...');

// Test data for different APIs
const testQueries = ['apple', 'chicken', 'rice', 'salmon'];

// API configurations
const APIs = {
    DummyJSON: {
        url: 'https://dummyjson.com/recipes',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    },
    Foodish: {
        url: 'https://foodish-api.com/api/',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    },
    Nutritionix: {
        url: 'https://trackapi.nutritionix.com/v2/search/instant?query=apple',
        method: 'GET',
        headers: {
            'x-app-id': '8faf5aed',
            'x-app-key': '88409220ce915ba9f6416710b7c27c97',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }
};

// Test DummyJSON API
async function testDummyJSON() {
    console.log('\n📊 Testing DummyJSON API...');
    try {
        const response = await fetch(APIs.DummyJSON.url, {
            method: APIs.DummyJSON.method,
            headers: APIs.DummyJSON.headers,
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`DummyJSON API failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ DummyJSON API Response Structure:');
        console.log('Total recipes:', data.recipes?.length || 0);
        
        if (data.recipes && data.recipes.length > 0) {
            const sampleRecipe = data.recipes[0];
            console.log('Sample recipe nutrition data:');
            console.log('- Calories:', sampleRecipe.caloriesPerServing || sampleRecipe.calories);
            console.log('- Protein:', sampleRecipe.protein);
            console.log('- Carbs:', sampleRecipe.carbs);
            console.log('- Fat:', sampleRecipe.fat);
            console.log('- Servings:', sampleRecipe.servings);
            console.log('- Full sample:', JSON.stringify(sampleRecipe, null, 2));
        }
        
        return data;
    } catch (error) {
        console.error('❌ DummyJSON API Error:', error);
        return null;
    }
}

// Test Foodish API
async function testFoodish() {
    console.log('\n📊 Testing Foodish API...');
    try {
        const response = await fetch(APIs.Foodish.url, {
            method: APIs.Foodish.method,
            headers: APIs.Foodish.headers,
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`Foodish API failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Foodish API Response Structure:');
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return data;
    } catch (error) {
        console.error('❌ Foodish API Error:', error);
        return null;
    }
}

// Test Nutritionix API
async function testNutritionix(query = 'apple') {
    console.log(`\n📊 Testing Nutritionix API with query: "${query}"...`);
    try {
        const url = `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            method: APIs.Nutritionix.method,
            headers: APIs.Nutritionix.headers,
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`Nutritionix API failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Nutritionix API Response Structure:');
        console.log('Common foods:', data.common?.length || 0);
        console.log('Branded foods:', data.branded?.length || 0);
        
        if (data.common && data.common.length > 0) {
            const sampleFood = data.common[0];
            console.log('Sample common food nutrition data:');
            console.log('- Name:', sampleFood.food_name);
            console.log('- Calories:', sampleFood.nf_calories);
            console.log('- Protein:', sampleFood.nf_protein);
            console.log('- Carbs:', sampleFood.nf_total_carbohydrate);
            console.log('- Fat:', sampleFood.nf_total_fat);
            console.log('- Serving qty:', sampleFood.serving_qty);
            console.log('- Serving unit:', sampleFood.serving_unit);
            console.log('- Serving weight (g):', sampleFood.serving_weight_grams);
            console.log('- Full sample:', JSON.stringify(sampleFood, null, 2));
        }
        
        if (data.branded && data.branded.length > 0) {
            const sampleBranded = data.branded[0];
            console.log('Sample branded food nutrition data:');
            console.log('- Name:', sampleBranded.food_name);
            console.log('- Calories:', sampleBranded.nf_calories);
            console.log('- Protein:', sampleBranded.nf_protein);
            console.log('- Carbs:', sampleBranded.nf_total_carbohydrate);
            console.log('- Fat:', sampleBranded.nf_total_fat);
            console.log('- Serving qty:', sampleBranded.serving_qty);
            console.log('- Serving unit:', sampleBranded.serving_unit);
            console.log('- Serving weight (g):', sampleBranded.serving_weight_grams);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Nutritionix API Error:', error);
        return null;
    }
}

// Test Nutritionix Natural Language API
async function testNutritionixNatural(query = 'apple') {
    console.log(`\n📊 Testing Nutritionix Natural Language API with query: "${query}"...`);
    try {
        const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
            method: 'POST',
            headers: {
                'x-app-id': '8faf5aed',
                'x-app-key': '88409220ce915ba9f6416710b7c27c97',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                timezone: 'US/Eastern'
            }),
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`Nutritionix Natural API failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Nutritionix Natural API Response Structure:');
        console.log('Foods found:', data.foods?.length || 0);
        
        if (data.foods && data.foods.length > 0) {
            const sampleFood = data.foods[0];
            console.log('Sample food nutrition data:');
            console.log('- Name:', sampleFood.food_name);
            console.log('- Calories:', sampleFood.nf_calories);
            console.log('- Protein:', sampleFood.nf_protein);
            console.log('- Carbs:', sampleFood.nf_total_carbohydrate);
            console.log('- Fat:', sampleFood.nf_total_fat);
            console.log('- Fiber:', sampleFood.nf_dietary_fiber);
            console.log('- Sugar:', sampleFood.nf_sugars);
            console.log('- Sodium:', sampleFood.nf_sodium);
            console.log('- Serving qty:', sampleFood.serving_qty);
            console.log('- Serving unit:', sampleFood.serving_unit);
            console.log('- Serving weight (g):', sampleFood.serving_weight_grams);
            console.log('- Full sample:', JSON.stringify(sampleFood, null, 2));
        }
        
        return data;
    } catch (error) {
        console.error('❌ Nutritionix Natural API Error:', error);
        return null;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting API Nutrition Data Tests...\n');
    
    // Test DummyJSON
    await testDummyJSON();
    
    // Test Foodish
    await testFoodish();
    
    // Test Nutritionix with different queries
    for (const query of testQueries) {
        await testNutritionix(query);
    }
    
    // Test Nutritionix Natural Language API
    await testNutritionixNatural('apple');
    
    console.log('\n✅ All API tests completed!');
    console.log('\n📋 Summary:');
    console.log('- DummyJSON: Provides recipes with caloriesPerServing, protein, carbs, fat');
    console.log('- Foodish: Provides only food images, no nutrition data');
    console.log('- Nutritionix: Provides detailed nutrition data per serving with serving weights');
    console.log('- Nutritionix Natural: Provides most detailed nutrition data including fiber, sugar, sodium');
}

// Run tests when script is loaded
runAllTests(); 