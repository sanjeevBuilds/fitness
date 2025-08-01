const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

// Test data
const testUser = {
    email: 'test@example.com',
    password: 'testpass123',
    profileName: 'Test User'
};

let authToken = null;
let userId = null;

async function testAPIs() {
    console.log('🧪 Testing HealthQuest APIs...\n');

    try {
        // 1. Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:8000/');
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('✅ Health endpoint:', health.message);
        } else {
            console.log('❌ Health endpoint failed');
        }

        // 2. Test user creation
        console.log('\n2. Testing user creation...');
        const createResponse = await fetch(`${API_BASE}/createUser`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        
        if (createResponse.ok) {
            const userData = await createResponse.json();
            console.log('✅ User created:', userData.profileName);
            userId = userData._id;
        } else {
            const error = await createResponse.json();
            console.log('⚠️ User creation:', error.error);
        }

        // 3. Test login
        console.log('\n3. Testing login...');
        const loginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            authToken = loginData.token;
            console.log('✅ Login successful:', loginData.profileName);
        } else {
            const error = await loginResponse.json();
            console.log('❌ Login failed:', error.message);
            return;
        }

        // 4. Test get user
        console.log('\n4. Testing get user...');
        const userResponse = await fetch(`${API_BASE}/getUser/${testUser.email}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (userResponse.ok) {
            const user = await userResponse.json();
            console.log('✅ User retrieved:', user.profileName);
        } else {
            console.log('❌ Get user failed');
        }

        // 5. Test smart quest data
        console.log('\n5. Testing smart quest data...');
        const questResponse = await fetch(`${API_BASE}/getSmartQuestData/${testUser.email}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (questResponse.ok) {
            const questData = await questResponse.json();
            console.log('✅ Smart quest data retrieved:', Object.keys(questData.quests));
        } else {
            console.log('❌ Smart quest data failed');
        }

        // 6. Test daily quest update
        console.log('\n6. Testing daily quest update...');
        const questUpdateResponse = await fetch(`${API_BASE}/updateDailyQuest`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                questType: 'steps',
                progress: 5000,
                completed: false
            })
        });
        
        if (questUpdateResponse.ok) {
            const updateData = await questUpdateResponse.json();
            console.log('✅ Quest updated:', updateData.success);
        } else {
            console.log('❌ Quest update failed');
        }

        // 7. Test food entry
        console.log('\n7. Testing food entry...');
        const foodResponse = await fetch(`${API_BASE}/foodentry/add`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                userId: userId,
                foodLog: {
                    date: new Date().toISOString().slice(0, 10),
                    calories: 500,
                    protein: 25,
                    carbs: 60,
                    fat: 15,
                    meals: []
                }
            })
        });
        
        if (foodResponse.ok) {
            const foodData = await foodResponse.json();
            console.log('✅ Food entry added:', foodData.success);
        } else {
            console.log('❌ Food entry failed');
        }

        // 8. Test daily totals
        console.log('\n8. Testing daily totals...');
        const totalsResponse = await fetch(`${API_BASE}/foodentry/daily-totals/${userId}?date=${new Date().toISOString().slice(0, 10)}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (totalsResponse.ok) {
            const totals = await totalsResponse.json();
            console.log('✅ Daily totals retrieved:', totals);
        } else {
            console.log('❌ Daily totals failed');
        }

        console.log('\n🎉 All API tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the tests
testAPIs(); 