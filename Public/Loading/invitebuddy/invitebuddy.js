document.addEventListener("DOMContentLoaded", () => {
  // Add fade-in animation for content
  const content = document.querySelector('.onboarding-content');
  content.style.opacity = '0';
  content.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    content.style.transition = 'all 0.6s ease';
    content.style.opacity = '1';
    content.style.transform = 'translateY(0)';
  }, 100);

  // Handle navigation buttons
  const backBtn = document.querySelector('.back-btn');
  const nextBtn = document.querySelector('.next-btn');

  backBtn.addEventListener('click', () => {
    // Go back to previous page
    window.location.href = '../firstpagexp/firstpageexp.html';
  });

  nextBtn.addEventListener('click', () => {
    goToLeaderboard();
  });

  // Add hover effects for buddy image
  const buddyImage = document.querySelector('.buddy-image');
  if (buddyImage) {
    buddyImage.addEventListener('mouseenter', () => {
      buddyImage.style.transform = 'scale(1.02)';
    });
    
    buddyImage.addEventListener('mouseleave', () => {
      buddyImage.style.transform = 'scale(1)';
    });
  }
});

function sendInvite() {
  const input = document.getElementById("buddy");
  const message = document.getElementById("message");

  if (input.value.trim() === "") {
    alert("Please enter an email address!");
    return;
  }

  // Show success message with animation
  message.style.display = "block";
  message.style.opacity = "0";
  message.style.transform = "translateY(10px)";
  
  setTimeout(() => {
    message.style.transition = "all 0.3s ease";
    message.style.opacity = "1";
    message.style.transform = "translateY(0)";
  }, 100);

  // Clear input
  input.value = "";
}

function goToLeaderboard() {
  // Add fade-out animation
  const content = document.querySelector('.onboarding-content');
  content.style.transition = 'all 0.4s ease';
  content.style.opacity = '0';
  content.style.transform = 'translateY(-20px)';

  setTimeout(() => {
    window.location.href = "../leaderboardfirstpage/leaderboradfirstpage.html";
  }, 400);
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    goToLeaderboard();
  } else if (e.key === "ArrowLeft") {
    window.history.back();
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
