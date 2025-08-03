window.addEventListener("DOMContentLoaded", () => {
  const heading = document.querySelector("h2");
  const paragraph = document.querySelector("p");

  setTimeout(() => {
    heading.classList.add("visible");
  }, 200);

  setTimeout(() => {
    paragraph.classList.add("visible");
  }, 1000);
});

document.querySelector(".next-btn").addEventListener("click", () => {
  alert("Proceeding to Step 5...");
});

document.querySelector(".skip-btn").addEventListener("click", () => {
  alert("Skipping this step...");
});
