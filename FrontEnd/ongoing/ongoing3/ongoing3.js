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

document.getElementById("diet-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Get user email from localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData || !userData.email) {
    alert('User not logged in. Please sign up or log in first.');
    return;
  }
  const email = userData.email;

  // Get form values
  const selects = document.querySelectorAll('#diet-form select');
  const textarea = document.querySelector('#diet-form textarea');
  if (selects.length < 2 || !textarea) {
    alert('Please fill out all fields.');
    return;
  }
  const dietType = selects[0].value;
  const allergies = [selects[1].value];
  const dietaryNotes = textarea.value;

  try {
            const response = await fetch(getApiUrl(`/api/updateUser/${encodeURIComponent(email)}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietType, allergies, dietaryNotes })
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Failed to update user.');
      return;
    }
    // Redirect to next onboarding step
    window.location.href = "../ongoing4/ongoing4.html";
  } catch (err) {
    alert('Server error. Please try again.');
  }
});

document.getElementById('sample-fill-btn').addEventListener('click', function() {
  const selects = document.querySelectorAll('#diet-form select');
  const textarea = document.querySelector('#diet-form textarea');
  if (selects.length >= 2 && textarea) {
    selects[0].value = 'balanced';
    selects[1].value = 'none';
    textarea.value = 'No restrictions, open to suggestions.';
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
