document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Disable button during request
        const submitBtn = loginForm.querySelector('.login-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store user data in localStorage
                localStorage.setItem('userData', JSON.stringify({
                    profileName: data.profileName,
                    avatar: data.avatar,
                    email: data.email,
                    xp: data.xp,
                    level: data.level,
                    createdAt: data.createdAt
                }));
                
                // Show success message
                alert(`Login successful!\n\nWelcome, ${data.profileName}!\nLevel: ${data.level}\nXP: ${data.xp}`);
                
                // Redirect to dashboard
                window.location.href = '/Public/Dashboard/dashbaord.html';
                
            } else {
                // Error
                alert(`Login failed: ${data.message}`);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: Network error. Please try again.');
        } finally {
            // Re-enable button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Auto-fill demo credentials for easy testing
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // Add click handler to demo info to auto-fill
    const demoInfo = document.querySelector('.demo-info');
    demoInfo.addEventListener('click', function() {
        emailInput.value = 'demo@example.com';
        passwordInput.value = 'password123';
    });
    
    // Add visual feedback that demo info is clickable
    demoInfo.style.cursor = 'pointer';
    demoInfo.title = 'Click to auto-fill demo credentials';
    
    // Check if user is already logged in
    const userData = localStorage.getItem('userData');
    if (userData) {
        // Redirect to dashboard if already logged in
        window.location.href = '/Public/Dashboard/dashbaord.html';
    }
});
