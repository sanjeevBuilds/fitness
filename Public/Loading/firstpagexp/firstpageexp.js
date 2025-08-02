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
    // Go back to signup page
    window.location.href = '../../Signup/Signup.html';
  });

  nextBtn.addEventListener('click', () => {
    // Go to next onboarding page (invite buddy)
    window.location.href = '../invitebuddy/invitebuddy.html';
  });

  // Add hover effects for feature highlights
  const featureHighlights = document.querySelectorAll('.feature-highlight');
  featureHighlights.forEach(feature => {
    feature.addEventListener('mouseenter', () => {
      feature.style.transform = 'translateY(-5px)';
    });
    
    feature.addEventListener('mouseleave', () => {
      feature.style.transform = 'translateY(0)';
    });
  });
});
