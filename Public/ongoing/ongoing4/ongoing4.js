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
    const response = await fetch(`http://localhost:8000/api/updateUser/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, notificationPreference })
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Failed to update user.');
      return;
    }
    // Redirect to dashboard after setup
    window.location.href = "../../Dashboard/dashbaord.html";
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
