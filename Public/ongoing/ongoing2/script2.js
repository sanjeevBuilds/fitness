document.getElementById("lifestyle-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Simulate form handling
  alert("Lifestyle info submitted! Moving to Step 3...");

  // Simulate progress
  document.querySelector(".progress").style.width = "75%";

  // In real app: move to step 3
});
