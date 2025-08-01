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

document.addEventListener('DOMContentLoaded', () => {
  async function fetchFriendRequests() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.email) return;

    try {
      const response = await fetch(`http://localhost:8000/api/notifications/friend-requests/${userData.email}`);
      if (!response.ok) {
        throw new Error('Failed to fetch friend requests');
      }
      const friendRequests = await response.json();
      renderFriendRequests(friendRequests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }

  function renderFriendRequests(friendRequests) {
    const container = document.getElementById('friend-requests');
    container.innerHTML = '';
    friendRequests.forEach(req => {
      const card = document.createElement('div');
      card.className = 'friend-request-card';
      card.innerHTML = `
        <img src="../../assets/${req.avatar}" alt="${req.profileName}" class="friend-avatar">
        <div class="friend-info">
          <div class="friend-name">${req.profileName}</div>
          <div class="friend-level">Level ${req.level || 1}</div>
        </div>
        <div class="friend-actions">
          <button class="accept-btn">Accept</button>
          <button class="decline-btn">Decline</button>
        </div>
      `;
      card.querySelector('.accept-btn').addEventListener('click', () => respondToRequest(req.email, 'accept'));
      card.querySelector('.decline-btn').addEventListener('click', () => respondToRequest(req.email, 'reject'));
      container.appendChild(card);
    });
  }

  async function respondToRequest(fromEmail, action) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.email) return;

    try {
      const response = await fetch('http://localhost:8000/api/respondFriendRequest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromEmail, toEmail: userData.email, action })
      });
      if (!response.ok) {
        throw new Error('Failed to respond to friend request');
      }
      fetchFriendRequests(); // Refresh the list
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  }

  fetchFriendRequests();
});
