// =======================
// DEPLOYING THE CONTENTS INTO JUDGE SIDE
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const judgleContainer = document.getElementById('judgleContainer');
  if (!judgleContainer) {
    console.error('❌ judgleContainer element not found in DOM');
    return;
  }

  // 🔑 Clear any old data on reload so judge always starts empty
  localStorage.removeItem('roundsData');
  localStorage.removeItem('processHTML');
  localStorage.removeItem('lastDeployTime');
  localStorage.setItem('adminRunning', 'false');

  // Always start with empty state
  renderJudgeDashboard(judgleContainer);

  // Auto-refresh when admin deploys new data (fires across tabs/windows)
  window.addEventListener('storage', (event) => {
    if (
      event.key === 'lastDeployTime' ||
      event.key === 'roundsData' ||
      event.key === 'adminRunning' ||
      event.key === 'processHTML'
    ) {
      console.log('🔔 Storage event detected, refreshing judge dashboard');
      renderJudgeDashboard(judgleContainer);
    }
  });

  // Periodic check every 5s to auto-empty if admin cleared/stopped
  setInterval(() => {
    renderJudgeDashboard(judgleContainer);
  }, 5000);
});

// =======================
// Main render function
// =======================
function renderJudgeDashboard(container) {
  // Clear old content
  container.innerHTML = '';

  const processHTML = localStorage.getItem('processHTML');
  let roundsData = [];
  try {
    roundsData = JSON.parse(localStorage.getItem('roundsData')) || [];
  } catch (e) {
    console.error('❌ Error parsing roundsData:', e);
    roundsData = [];
  }
  const lastDeployTime = localStorage.getItem('lastDeployTime');
  const adminRunning = localStorage.getItem('adminRunning'); // flag set by admin

  // ✅ Always show empty state if admin not running OR no deploy data
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

  // ✅ Render snapshot exactly as saved by admin (all contents of process page)
  if (processHTML) {
    container.innerHTML = processHTML;
  }

  // ✅ Append structured roundsData (contestant cards with URLs) if available
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
  card.className = 'bg-white shadow rounded p-4 text-center';
  card.innerHTML = `
    <img src="${imageUrl}" alt="Contestant ${id}" 
         class="w-64 h-64 object-cover rounded mb-2" />
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

