// --- JWT Auth Check (Protected Page) ---
(async function() {
    const redirectToLogin = () => {
        window.location.href = '/Public/Login/login.html';
    };
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        redirectToLogin();
        return;
    }
    
    // Validate token with server
    try {
        const response = await fetch('https://your-app-name.onrender.com/api/validateToken', {
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

document.getElementById("onboarding-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Get user email from localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData || !userData.email) {
    alert('User not logged in. Please sign up or log in first.');
    return;
  }
  const email = userData.email;

  // Get form values
  const formInputs = document.querySelectorAll('#onboarding-form input');
  const select = document.querySelector('#onboarding-form select');
  if (formInputs.length < 5 || !select) {
    alert('Please fill out all fields.');
    return;
  }
  const [fullName, age, gender, height, weight] = [
    formInputs[0].value,
    Number(formInputs[1].value),
    formInputs[2].value,
    Number(formInputs[3].value),
    Number(formInputs[4].value)
  ];
  const primaryGoal = select.value;

  try {
    const response = await fetch(`https://your-app-name.onrender.com/api/updateUser/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, age, gender, height, weight, primaryGoal })
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Failed to update user.');
      return;
    }
    // Redirect to next onboarding step
    window.location.href = "../ongoing2/ongoing2.html";
  } catch (err) {
    alert('Server error. Please try again.');
  }
});

document.getElementById('sample-fill-btn').addEventListener('click', function() {
  const formInputs = document.querySelectorAll('#onboarding-form input');
  const select = document.querySelector('#onboarding-form select');
  if (formInputs.length >= 5 && select) {
    formInputs[0].value = 'Taylor Smith';
    formInputs[1].value = 28;
    formInputs[2].value = 'Female';
    formInputs[3].value = 170;
    formInputs[4].value = 65;
    select.value = 'muscle_gain';
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
