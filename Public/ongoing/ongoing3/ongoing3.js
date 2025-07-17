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
    const response = await fetch(`http://localhost:8000/api/updateUser/${encodeURIComponent(email)}`, {
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
