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

  // Handle enter dashboard button
  const enterBtn = document.querySelector('.enter-btn');
  enterBtn.addEventListener('click', () => {
    // Show super animation overlay
    const overlay = document.getElementById('super-animation-overlay');
    overlay.classList.add('active');
    
    // After animation plays, redirect to dashboard
    setTimeout(() => {
      window.location.href = '../../Dashboard/dashbaord.html';
    }, 3000); // 3 seconds for the super animation
  });

  // Add hover effects for welcome image
  const welcomeImage = document.querySelector('.welcome-image');
  if (welcomeImage) {
    welcomeImage.addEventListener('mouseenter', () => {
      welcomeImage.style.transform = 'scale(1.02)';
    });
    
    welcomeImage.addEventListener('mouseleave', () => {
      welcomeImage.style.transform = 'scale(1)';
    });
  }
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.querySelector('.enter-btn').click();
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
