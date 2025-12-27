// =======================
// DEPLOYING THE CONTENTS INTO JUDGE SIDE
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const judgeContainer = document.getElementById('judgeContainer');
  if (!judgeContainer) return console.error('❌ judgeContainer element not found in DOM');

  let lastRenderedDeployTime = null;

  renderJudgeDashboard(judgeContainer);

  window.addEventListener('storage', (event) => {
    if (event.key === 'lastDeployTime') {
      const newDeployTime = localStorage.getItem('lastDeployTime');
      if (newDeployTime && newDeployTime !== lastRenderedDeployTime) {
        lastRenderedDeployTime = newDeployTime;
        renderJudgeDashboard(judgeContainer);
      }
    }
  });

  // =======================
  // JUDGE USER DROPDOWN & LOGOUT
  // =======================
  const judgeUserIconContainer = document.getElementById('judgeUserIconContainer');
  const judgeDropdown = document.getElementById('judgeDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogout = document.getElementById('confirmLogout');
  const cancelLogout = document.getElementById('cancelLogout');

  const currentUser = localStorage.getItem('currentUser');
  const currentRole = localStorage.getItem('currentRole');
  if (currentUser && currentRole) {
    const usernameEl = judgeDropdown.querySelector('.judge-username');
    const roleEl = judgeDropdown.querySelector('.judge-role');
    if (usernameEl) usernameEl.textContent = currentUser;
    if (roleEl) roleEl.textContent = currentRole;
  }

  judgeUserIconContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    judgeDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => judgeDropdown.classList.remove('show'));
  logoutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    logoutModal.classList.add('show');
  });
  cancelLogout.addEventListener('click', () => logoutModal.classList.remove('show'));
  confirmLogout.addEventListener('click', () => {
    ['currentUser', 'currentRole', 'roundsData', 'processHTML', 'lastDeployTime']
      .forEach(key => localStorage.removeItem(key));
    window.location.href = 'default.html';
  });
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) logoutModal.classList.remove('show');
  });

 // =======================
// MAIN RENDER FUNCTION
// =======================
function renderJudgeDashboard(container) {
  const processHTML = localStorage.getItem('processHTML');
  const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
  const lastDeployTime = localStorage.getItem('lastDeployTime');
  const adminRunning = localStorage.getItem('adminRunning');

  if (adminRunning !== 'true' || !lastDeployTime || (!processHTML && roundsData.length === 0)) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center mt-20 text-gray-500">
        <p class="text-lg font-semibold mb-4">No deployed rounds yet</p>
        <p class="text-sm mb-6">Please wait until the admin deploys content</p>
        <div class="loader-dots"><div></div><div></div><div></div></div>
      </div>
    `;
    lastRenderedDeployTime = null;
    return;
  }

  lastRenderedDeployTime = lastDeployTime;
  container.innerHTML = processHTML;

  // =======================
  // Add Images + Help Icons per round
  // =======================
  roundsData.forEach(round => {
    // Find or create round container
    let roundContainer = container.querySelector(`#round-${round.roundNumber}`);
    if (!roundContainer) {
      roundContainer = document.createElement('div');
      roundContainer.id = `round-${round.roundNumber}`;
      roundContainer.className = 'round-container mb-4';
      container.appendChild(roundContainer);
    }

    // Create icon wrapper
    let iconWrapper = roundContainer.querySelector('.icon-wrapper');
    if (!iconWrapper) {
      iconWrapper = document.createElement('div');
      iconWrapper.className = 'flex items-center gap-2 justify-end mb-2 icon-wrapper';
      roundContainer.prepend(iconWrapper);
    }
    
  });

  // =======================
  // Render contestant cards (gallery) per round
  // =======================
  if (roundsData.length > 0) {
    const roundsWrapper = document.createElement('div');
    roundsWrapper.className = 'mt-2';
    roundsData.forEach(round => {
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-2 md:grid-cols-3 gap-6 mb-6';
      grid.dataset.round = round.roundNumber;
      Object.entries(round.savedImages || {}).forEach(([id, imageUrl]) => {
        const card = document.createElement('div');
        card.className = 'bg-white shadow rounded p-4 text-center contestant-card';
        card.innerHTML = `
          <img src="${imageUrl}" alt="Contestant ${id}" />
          <p class="font-medium">Contestant ${id}</p>
        `;
        grid.appendChild(card);
      });
      roundsWrapper.appendChild(grid);
    });
    container.appendChild(roundsWrapper);
  }

  // Activate help icons
  bindCriteriaModal(container);

  // =======================
  // Images Icon Modal
  // =======================
  let imagesModal = document.getElementById('imagesModal');
  if (!imagesModal) {
    imagesModal = document.createElement('div');
    imagesModal.id = 'imagesModal';
    imagesModal.className = 'modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    imagesModal.innerHTML = `
      <div class="modal-card bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Round Images</h2>
          <button id="closeImagesModal" class="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div id="imagesContent" class="grid grid-cols-2 md:grid-cols-3 gap-4"></div>
      </div>
    `;
    document.body.appendChild(imagesModal);

    // Close handlers
    document.getElementById('closeImagesModal').addEventListener('click', () => imagesModal.classList.add('hidden'));
    imagesModal.addEventListener('click', e => {
      if (e.target === imagesModal) imagesModal.classList.add('hidden');
    });
  }

  container.addEventListener('click', (e) => {
    const clickedImagesIcon = e.target.closest('.images-icon');
    if (!clickedImagesIcon) return;

    const roundNumber = parseInt(clickedImagesIcon.dataset.round, 10);
    const round = roundsData.find(r => r.roundNumber === roundNumber);
    if (!round) return;

    // Populate modal with images
    const imagesContent = document.getElementById('imagesContent');
    imagesContent.innerHTML = ''; // clear previous

    Object.entries(round.savedImages || {}).forEach(([id, url]) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'p-1 border rounded bg-gray-50';
      imgWrapper.innerHTML = `<img src="${url}" alt="Contestant ${id}" class="w-full h-auto rounded" />`;
      imagesContent.appendChild(imgWrapper);
    });

    imagesModal.classList.remove('hidden');
  });
}

 // =======================
// ACTIVATE HELP ICONS (FULL CRITERIA BREAKDOWN)
// =======================
function bindCriteriaModal(container) {
  const criteriaModal = document.getElementById('criteriaModal');
  const criteriaContent = document.getElementById('criteriaContent');
  const closeBtn = document.getElementById('closeCriteriaModal');

  if (!criteriaModal || !criteriaContent || !closeBtn) return;

  // Close handlers
  if (!criteriaModal.dataset.bound) {
    closeBtn.addEventListener('click', () => criteriaModal.classList.add('hidden'));
    criteriaModal.addEventListener('click', (evt) => {
      if (evt.target === criteriaModal) criteriaModal.classList.add('hidden');
    });
    criteriaModal.dataset.bound = 'true';
  }

  // Delegated listener for help icons
  container.addEventListener('click', (e) => {
    const icon = e.target.closest('.help-icon');
    if (!icon) return;

    const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
    const roundIndex = parseInt(icon.dataset.round, 10) - 1;

    criteriaContent.innerHTML = '';

    if (roundsData.length && roundsData[roundIndex]) {
      const round = roundsData[roundIndex];

      // Modal header
      const header = document.createElement('h3');
      header.className = 'text-2xl font-bold text-indigo-600 mb-6 text-center';
      header.textContent = `Criteria for Judging (Round ${round.roundNumber})`;
      criteriaContent.appendChild(header);

      // Render each criteria block
      round.criteria.forEach(c => {
        const block = document.createElement('div');
        block.className = 'criteria-block mb-6';

        const title = document.createElement('p');
        title.className = 'criteria-title text-lg font-bold text-indigo-700';
        title.textContent = c.name;

        const max = document.createElement('p');
        max.className = 'criteria-max text-sm text-gray-600 mb-2';
        max.textContent = c.maxPoints;

        const ul = document.createElement('ul');
        ul.className = 'list-disc list-inside space-y-1';
        (c.items || []).forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        });

        block.appendChild(title);
        block.appendChild(max);
        block.appendChild(ul);
        criteriaContent.appendChild(block);
      });
    } else {
      criteriaContent.innerHTML = '<p class="text-gray-500 text-sm">No criteria deployed yet.</p>';
    }

    criteriaModal.classList.remove('hidden');
    setTimeout(() => criteriaModal.classList.add('show'), 10);
  });
}
})
