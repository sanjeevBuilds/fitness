

document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const inputs = document.querySelectorAll("input");
  let valid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      alert("Please fill out all fields.");
      valid = false;
      return;
    }
  });

  const [profileName, email, password, confirmPassword] = [inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value];
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    valid = false;
  }

  if (valid) {
    // All onboarding fields with defaults
    const defaultUser = {
      profileName,
      email,
      password,
      fullName: '',
      age: null,
      gender: '',
      height: null,
      weight: null,
      primaryGoal: 'fitness',
      activityLevel: 'moderate',
      averageSleep: null,
      waterIntake: null,
      mealFrequency: '3',
      dietType: 'balanced',
      allergies: ['none'],
      dietaryNotes: '',
      username: undefined,
      notificationPreference: 'important',
      bmi: null,
      targetWeight: null
    };
    try {
      const response = await fetch('https://fitness-ewwi.onrender.com/api/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultUser)
      });
      if (response.ok) {
        console.log('yessssss');
        const data = await response.json();
        
        // Clear ALL localStorage data to ensure fresh start for new user
        console.log('Clearing localStorage for new user...');
        localStorage.clear();
        
        // Set only the essential user data
        localStorage.setItem('userData', JSON.stringify({
            _id: data._id,
            profileName: data.profileName,
            avatar: data.avatar,
            email: data.email,
            xp: data.xp,
            level: data.level,
            coins: data.coins || 0,
            createdAt: data.createdAt,
            token: data.token // if present
        }));
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }
        
        console.log('New user data set in localStorage:', {
            userData: JSON.parse(localStorage.getItem('userData')),
            authToken: localStorage.getItem('authToken')
        });
        
                 window.location.href = "../ongoing/ongoing1/ongoing.html";
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create user.');
      }
    } catch (err) {
      alert('Server error. Please try again.');
    }
  }
});

document.getElementById('random-fill-btn').addEventListener('click', function() {
  const names = [
    'Alex Johnson', 'Jamie Lee', 'Taylor Smith', 'Jordan Brown', 'Morgan Davis',
    'Casey Wilson', 'Riley Clark', 'Avery Lewis', 'Peyton Walker', 'Quinn Hall'
  ];
  const name = names[Math.floor(Math.random() * names.length)];
  const email = `user${Math.floor(Math.random() * 10000)}@example.com`;
  const formInputs = document.querySelectorAll('form input');
  if (formInputs.length >= 4) {
    formInputs[0].value = name;
    formInputs[1].value = email;
    formInputs[2].value = '12345678';
    formInputs[3].value = '12345678';
  }
});
