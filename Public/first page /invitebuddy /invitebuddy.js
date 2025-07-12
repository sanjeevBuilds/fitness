function sendInvite() {
  const input = document.getElementById("buddy");
  const message = document.getElementById("message");

  if (input.value.trim() === "") {
    alert("Please enter an email address!");
    return;
  }

  message.style.display = "block";
  message.classList.add("fade-in");
}

function goToLeaderboard() {
  const page = document.getElementById("page");
  page.classList.add("fade-out");

  setTimeout(() => {
    window.location.href = "../leaderboardfirstpage/leaderboardfirstpage.html";
  }, 400); // match CSS fade timing
}

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    goToLeaderboard();
  } else if (e.key === "ArrowLeft") {
    window.history.back();
  }
});
