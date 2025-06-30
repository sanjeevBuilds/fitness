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
            console.log('Attempting login with:', { email, password: '***' });
               const response = await fetch('http://localhost:8000/api/login', {
         
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Login response:', data);
            
            if (data.success) {
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
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                alert('Login failed: Server is not running. Please start the server first.');
            } else {
                alert(`Login failed: ${error.message}`);
            }
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
        passwordInput.value = 'test1234';
    });
    
    // Add visual feedback that demo info is clickable
    demoInfo.style.cursor = 'pointer';
    demoInfo.title = 'Click to auto-fill demo credentials';
});
