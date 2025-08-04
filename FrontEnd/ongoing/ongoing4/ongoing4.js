// --- JWT Auth Check (Protected Page) ---
(async function() {
    const redirectToLogin = () => {
        window.location.href = '../Login/login.html';
    };
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        redirectToLogin();
        return;
    }
    
    // Validate token with server
    try {
        const response = await fetch(getApiUrl('/api/validateToken'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
    } catch (error) {
        console.error('Auth validation failed:', error);
        localStorage.removeItem('authToken');
        redirectToLogin();
        return;
    }
})();

document.getElementById("account-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Get user email from localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData || !userData.email) {
    alert('User not logged in. Please sign up or log in first.');
    return;
  }
  const email = userData.email;

  // Get form values
  const inputs = document.querySelectorAll('#account-form input');
  const select = document.querySelector('#account-form select');
  if (inputs.length < 1 || !select) {
    alert('Please fill out all fields.');
    return;
  }
  const username = inputs[0].value;
  const notificationPreference = select.value;

  try {
            const response = await fetch(getApiUrl(`/api/updateUser/${encodeURIComponent(email)}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, notificationPreference })
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Failed to update user.');
      return;
    }
    // Redirect to onboarding flow after setup
    window.location.href = "../../Loading/firstpagexp/firstpageexp.html";
  } catch (err) {
    alert('Server error. Please try again.');
  }
});

document.getElementById('sample-fill-btn').addEventListener('click', function() {
  const inputs = document.querySelectorAll('#account-form input');
  const select = document.querySelector('#account-form select');
  if (inputs.length >= 1 && select) {
    inputs[0].value = 'taylorfit';
    select.value = 'important';
  }
});

// Sign Out function
function signOut() {
    // Clear localStorage
    localStorage.clear();
    
    // Show a brief message
    alert('Signed out successfully!');
    
    // Redirect to home page
    window.location.href = '../../Home/home.html';
}
