(function() {
  const redirectToLogin = () => {
      window.location.href = '/Public/test/login.html';
  };
  const token = localStorage.getItem('authToken');
  if (!token) {
      redirectToLogin();
      return;
  }
  try {
      const decoded = window.jwt_decode ? window.jwt_decode(token) : null;
      if (!decoded || !decoded.exp) {
          localStorage.removeItem('authToken');
          redirectToLogin();
          return;
      }
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
          localStorage.removeItem('authToken');
          redirectToLogin();
          return;
      }
  } catch (e) {
      localStorage.removeItem('authToken');
      redirectToLogin();
  }
})();

document.getElementById("lifestyle-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Get user email from localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData || !userData.email) {
    alert('User not logged in. Please sign up or log in first.');
    return;
  }
  const email = userData.email;

  // Get form values
  const selects = document.querySelectorAll('#lifestyle-form select');
  const inputs = document.querySelectorAll('#lifestyle-form input');
  if (selects.length < 2 || inputs.length < 2) {
    alert('Please fill out all fields.');
    return;
  }
  const activityLevel = selects[0].value;
  const averageSleep = Number(inputs[0].value);
  const waterIntake = Number(inputs[1].value);
  const mealFrequency = selects[1].value;

  try {
    const response = await fetch(`http://localhost:8000/api/updateUser/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityLevel, averageSleep, waterIntake, mealFrequency })
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Failed to update user.');
      return;
    }
    // Redirect to next onboarding step
    window.location.href = "../ongoing3/ongoing3.html";
  } catch (err) {
    alert('Server error. Please try again.');
  }
});

document.getElementById('sample-fill-btn').addEventListener('click', function() {
  const selects = document.querySelectorAll('#lifestyle-form select');
  const inputs = document.querySelectorAll('#lifestyle-form input');
  if (selects.length >= 2 && inputs.length >= 2) {
    selects[0].value = 'moderate';
    inputs[0].value = 7;
    inputs[1].value = 2.5;
    selects[1].value = '3';
  }
});
