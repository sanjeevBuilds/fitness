document.getElementById("onboarding-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Normally you'd validate and store data here before moving to the next step
  alert("Form submitted! Proceeding to the next step...");

  // Simulate navigation or update progress (can be replaced with real logic)
  const progress = document.getElementById("progress");
  progress.style.width = "50%";

  // In a real app, redirect or show next section here
});
