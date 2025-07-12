document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();
  const inputs = document.querySelectorAll("input");
  let valid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      alert("Please fill out all fields.");
      valid = false;
      return;
    }
  });

  const [password, confirmPassword] = [inputs[2].value, inputs[3].value];
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    valid = false;
  }

  if (valid) {
    alert("Form submitted successfully!");
    // Here you'd typically send data to a server
  }
});
