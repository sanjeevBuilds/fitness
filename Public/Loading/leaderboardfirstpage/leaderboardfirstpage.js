console.log("Leaderboard JS loaded");

// Hide loader on page load
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
});

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
    window.location.href = '../invitebuddy/invitebuddy.html';
  });

  nextBtn.addEventListener('click', () => {
    goToWelcome();
  });

  // Add hover effects for benefit items
  const benefitItems = document.querySelectorAll('.benefit-item');
  benefitItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-5px)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0)';
    });
  });

  // Add hover effects for leaderboard image
  const leaderboardImage = document.querySelector('.leaderboard-image');
  if (leaderboardImage) {
    leaderboardImage.addEventListener('mouseenter', () => {
      leaderboardImage.style.transform = 'scale(1.02)';
    });
    
    leaderboardImage.addEventListener('mouseleave', () => {
      leaderboardImage.style.transform = 'scale(1)';
    });
  }
});

function goToWelcome() {
  // Add fade-out animation
  const content = document.querySelector('.onboarding-content');
  content.style.transition = 'all 0.4s ease';
  content.style.opacity = '0';
  content.style.transform = 'translateY(-20px)';

  setTimeout(() => {
    window.location.href = "../welcome/welcome.html";
  }, 400);
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    goToWelcome();
  } else if (e.key === "ArrowLeft") {
    window.history.back();
  }
});
