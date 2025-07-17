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
    const response = await fetch(`http://localhost:8000/api/updateUser/${encodeURIComponent(email)}`, {
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
