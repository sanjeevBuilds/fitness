// --- JWT Auth Check (Protected Page) ---
(function() {
    const redirectToLogin = () => {
        window.location.href = '/Public/test/login.html';
    };
    const token = localStorage.getItem('authToken');
    if (!token) {
        redirectToLogin();
        return;
    }
    // jwt-decode must be loaded via CDN in the HTML
    try {
        const decoded = window.jwt_decode ? window.jwt_decode(token) : null;
        if (!decoded || !decoded.exp) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        // exp is in seconds since epoch
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        // Token is valid, allow access
    } catch (e) {
        localStorage.removeItem('authToken');
        redirectToLogin();
    }
})();

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
