console.log("Leaderboard JS loaded");

// Hide loader on page load
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
});

// Go to next step with fade
function goToStep3() {
  const page = document.getElementById("page");
  page.classList.add("fade-out");

  setTimeout(() => {
    window.location.href = "step3.html"; // or change to actual page
  }, 400);
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    goToStep3();
  } else if (e.key === "ArrowLeft") {
    window.history.back();
  }
});
