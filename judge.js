// =======================
// DEPLOYING THE CONTENTS INTO JUDGE SIDE
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const judgleContainer = document.getElementById('judgeContainer');
  if (!judgleContainer) {
    console.error('❌ judgeContainer element not found in DOM');
    return;
  }

  // Clear old data on reload
  localStorage.removeItem('roundsData');
  localStorage.removeItem('processHTML');
  localStorage.removeItem('lastDeployTime');
  localStorage.setItem('adminRunning', 'false');

  // Initial render
  renderJudgeDashboard(judgleContainer);

  // Auto-refresh on storage events
  window.addEventListener('storage', (event) => {
    if (['lastDeployTime', 'roundsData', 'adminRunning', 'processHTML'].includes(event.key)) {
      console.log('🔔 Storage event detected, refreshing judge dashboard');
      renderJudgeDashboard(judgleContainer);
    }
  });

  // Periodic check every 5s
  setInterval(() => renderJudgeDashboard(judgleContainer), 5000);

  // =======================
  // JUDGE USER DROPDOWN & LOGOUT (with modal)
  // =======================
  const judgeUserIconContainer = document.getElementById('judgeUserIconContainer');
  const judgeDropdown = document.getElementById('judgeDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogout = document.getElementById('confirmLogout');
  const cancelLogout = document.getElementById('cancelLogout');

  // Set username and role in dropdown
  const currentUser = localStorage.getItem('currentUser');
  const currentRole = localStorage.getItem('currentRole');
  if (currentUser && currentRole) {
    const usernameEl = judgeDropdown.querySelector('.judge-username');
    const roleEl = judgeDropdown.querySelector('.judge-role');
    if (usernameEl) usernameEl.textContent = currentUser;
    if (roleEl) roleEl.textContent = currentRole;
  }

  // Toggle dropdown on icon click
  judgeUserIconContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    judgeDropdown.classList.toggle('show');
    judgeUserIconContainer.classList.toggle('active'); // rotate arrow
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    if (judgeDropdown.classList.contains('show')) {
      judgeDropdown.classList.remove('show');
      judgeUserIconContainer.classList.remove('active');
    }
  });

  // Show modal
logoutBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  logoutModal.classList.add('show');
});

// Cancel logout
cancelLogout.addEventListener('click', () => {
  logoutModal.classList.remove('show');
});

// Confirm logout
confirmLogout.addEventListener('click', () => {
  ['currentUser', 'currentRole', 'roundsData', 'processHTML', 'lastDeployTime'].forEach(key => localStorage.removeItem(key));
  localStorage.setItem('adminRunning', 'false');
  window.location.href = 'default.html';
});

 
// Close modal if clicking outside the modal card
logoutModal.addEventListener('click', (e) => {
  if (e.target === logoutModal) logoutModal.classList.remove('show');
});

   
  
  // =======================
  // Main render function
  // =======================
  function renderJudgeDashboard(container) {
    container.innerHTML = '';

    const processHTML = localStorage.getItem('processHTML');
    let roundsData = [];
    try {
      roundsData = JSON.parse(localStorage.getItem('roundsData')) || [];
    } catch (e) {
      console.error('❌ Error parsing roundsData:', e);
    }

    const lastDeployTime = localStorage.getItem('lastDeployTime');
    const adminRunning = localStorage.getItem('adminRunning');

    // Empty state if no deploy data
    if (adminRunning !== 'true' || !lastDeployTime || (!processHTML && (!roundsData || roundsData.length === 0))) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center mt-20 text-gray-500">
          <p class="text-lg font-semibold mb-4">No deployed rounds yet</p>
          <p class="text-sm mb-6">Please wait until the admin deploys content</p>
          <div class="loader-dots"><div></div><div></div><div></div></div>
        </div>
      `;
      return;
    }

    // Render admin snapshot
    if (processHTML) container.innerHTML = processHTML;

    // Append roundsData if available
    if (roundsData.length > 0) {
      const roundsWrapper = document.createElement('div');
      roundsWrapper.className = 'mt-10';

      roundsData.forEach((round, roundIndex) => {
        const roundEl = document.createElement('div');
        roundEl.className = 'mb-8';
        roundEl.innerHTML = `<h2 class="text-xl font-bold mb-4">Round ${roundIndex + 1}</h2>`;

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 md:grid-cols-3 gap-6';

        Object.entries(round.savedImages || {}).forEach(([id, imageUrl]) => {
          const card = document.createElement('div');
          card.className = 'bg-white shadow rounded p-4 text-center contestant-card';
          card.innerHTML = `
            <img src="${imageUrl}" alt="Contestant ${id}" />
            <p class="font-medium">Contestant ${id}</p>
          `;
          grid.appendChild(card);
        });

        roundEl.appendChild(grid);
        roundsWrapper.appendChild(roundEl);
      });

      container.appendChild(roundsWrapper);
    }
  }
})
