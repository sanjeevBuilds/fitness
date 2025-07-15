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

