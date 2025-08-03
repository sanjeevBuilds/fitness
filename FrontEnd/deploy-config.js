// Deployment Configuration Script
// Run this script to update API URLs for production deployment

const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_API_URL = 'https://fitness-ewwi.onrender.com'; // Change this to your Render URL
const LOCAL_API_URL = 'http://localhost:8000';

// Files to update (relative to FrontEnd root)
const filesToUpdate = [
    'Signup/Signup.js',
    'shared-sidebar.js',
    'Public/ongoing/ongoing4/ongoing4.js',
    'Public/ongoing/ongoing3/ongoing3.js',
    'Public/ongoing/ongoing2/ongoing2.js',
    'Public/ongoing/ongoing1/ongoing.js',
    'Notifications/Notifications.js',
    'Login/login.js',
    'FoodSuggestion/FoodSuggestion.js',
    'Dashboard/Settings.js',
    'Dashboard/Posture.js',
    'Dashboard/FoodLog.js',
    'Dashboard/Buddies.js',
    'Dashboard/dashboard.js'
];

function updateApiUrls() {
    console.log('🔄 Updating API URLs for production deployment...');
    
    filesToUpdate.forEach(file => {
        const filePath = path.join(__dirname, file);
        
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;
            
            // Replace localhost URLs with production URL
            content = content.replace(new RegExp(LOCAL_API_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), PRODUCTION_API_URL);
            
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Updated: ${file}`);
            } else {
                console.log(`⏭️  No changes needed: ${file}`);
            }
        } else {
            console.log(`❌ File not found: ${file}`);
        }
    });
    
    // Update config.js
    const configPath = path.join(__dirname, 'config.js');
    if (fs.existsSync(configPath)) {
        let configContent = fs.readFileSync(configPath, 'utf8');
        configContent = configContent.replace(
            /BASE_URL:\s*['"`][^'"`]*['"`]/,
            `BASE_URL: '${PRODUCTION_API_URL}'`
        );
        fs.writeFileSync(configPath, configContent, 'utf8');
        console.log('✅ Updated: config.js');
    }
    
    console.log('\n🎉 API URLs updated for production!');
    console.log(`📡 Backend URL: ${PRODUCTION_API_URL}`);
    console.log('\n📝 Next steps:');
    console.log('1. Deploy backend to Render');
    console.log('2. Deploy frontend to Vercel');
    console.log('3. Test all functionality');
}

function revertToLocal() {
    console.log('🔄 Reverting API URLs to local development...');
    
    filesToUpdate.forEach(file => {
        const filePath = path.join(__dirname, file);
        
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;
            
            // Replace production URL with localhost
            content = content.replace(new RegExp(PRODUCTION_API_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), LOCAL_API_URL);
            
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Reverted: ${file}`);
            } else {
                console.log(`⏭️  No changes needed: ${file}`);
            }
        } else {
            console.log(`❌ File not found: ${file}`);
        }
    });
    
    // Revert config.js
    const configPath = path.join(__dirname, 'config.js');
    if (fs.existsSync(configPath)) {
        let configContent = fs.readFileSync(configPath, 'utf8');
        configContent = configContent.replace(
            /BASE_URL:\s*['"`][^'"`]*['"`]/,
            `BASE_URL: '${LOCAL_API_URL}'`
        );
        fs.writeFileSync(configPath, configContent, 'utf8');
        console.log('✅ Reverted: config.js');
    }
    
    console.log('\n🎉 API URLs reverted to local development!');
}

// Command line interface
const command = process.argv[2];

if (command === 'deploy') {
    updateApiUrls();
} else if (command === 'revert') {
    revertToLocal();
} else {
    console.log('Usage:');
    console.log('  node deploy-config.js deploy  - Update URLs for production');
    console.log('  node deploy-config.js revert  - Revert URLs to local development');
    console.log('\nMake sure to update PRODUCTION_API_URL in this script first!');
} 