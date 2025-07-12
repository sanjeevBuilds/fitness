// Handle search functionality using real data (USDA API)
document.getElementById("food-search").addEventListener("input", function (e) {
  const query = e.target.value.toLowerCase();
  const apiKey = "9PJa17Y1Uqvi4Q26ZE9a0tBarvCTWnLGK6ixeZCT";

  fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${query}&api_key=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      const container = document.querySelector(".suggestions");
      container.innerHTML = `<h2>Search Results for "${query}"</h2>`;

      data.foods.slice(0, 5).forEach((food) => {
        const card = document.createElement("div");
        card.className = "food-card";
        card.innerHTML = `
          <div class="text">
            <span class="xp">FDC ID: ${food.fdcId}</span>
            <h3>${food.description}</h3>
            <p>Brand: ${food.brandName || "N/A"}</p>
            <p>Calories: ${food.foodNutrients?.find(n => n.nutrientName === "Energy")?.value || "N/A"} kcal</p>
          </div>
        `;
        container.appendChild(card);
      });
    })
    .catch((err) => console.error("API Error:", err));
});

// Scroll to top on meal plan button
const mealPlanBtn = document.querySelector(".generate-btn");
if (mealPlanBtn) {
  mealPlanBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Toggle recipe details
const viewBtns = document.querySelectorAll(".view-recipe-btn");
viewBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const recipe = btn.nextElementSibling;
    recipe.classList.toggle("hidden");
    btn.textContent = recipe.classList.contains("hidden") ? "View Recipe" : "Hide Recipe";
  });
});

// Back button functionality
const backBtn = document.querySelector(".back-btn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    document.querySelector(".food-expanded").style.display = "none";
    document.querySelector(".suggestions").style.display = "block";
  });
}

// Show expanded food view
const suggestionCards = document.querySelectorAll(".suggestion-card");
suggestionCards.forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelector(".suggestions").style.display = "none";
    document.querySelector(".food-expanded").style.display = "block";
  });
});
