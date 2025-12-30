// =======================
// JUDGE DASHBOARD LOGIC (UPDATED VERSION DEC 30!)
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const judgeContainer = document.getElementById('judgeContainer');
  if (!judgeContainer) return console.error('❌ judgeContainer element not found in DOM');

  let lastRenderedDeployTime = null;

  // Helper to generate stable keys for submissions
  function getSubmissionKey(roundNumber, tableIndex) {
    return `submitted_round_${roundNumber}_table_${tableIndex}`;
  }

  function getScoresKey(roundNumber, tableIndex) {
    return `scores_round_${roundNumber}_table_${tableIndex}`;
  }

  // =======================
  // MAIN RENDER FUNCTION
  // =======================
  function renderJudgeDashboard(container) {
    const processHTML = localStorage.getItem('processHTML');
    const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
    const lastDeployTime = localStorage.getItem('lastDeployTime');
    const adminRunning = localStorage.getItem('adminRunning');
    const lastDeployedRound = Number(localStorage.getItem('lastDeployedRoundNumber') || 1);
    const lastResetRound = Number(localStorage.getItem('lastResetRound') || 0);

    // 🔥 RESET SUBMISSIONS ONLY WHEN ROUND 1 IS RE-DEPLOYED
    if (lastDeployedRound === 1 && lastResetRound !== 1) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('submitted_round_') || k.startsWith('scores_round_'))
        .forEach(k => localStorage.removeItem(k));
      localStorage.setItem('lastResetRound', '1');
    }
    if (lastDeployedRound > 1) localStorage.setItem('lastResetRound', String(lastDeployedRound));

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
    // BUILD SCORE INPUTS + TOTALS
    // =======================
    const judgeTables = container.querySelectorAll('.judge-table-container table tbody');
    judgeTables.forEach((tbody, tableIndex) => {
      const rows = tbody.querySelectorAll('tr');
      const roundWrapper = tbody.closest('[data-round]');
      const roundNumber = roundWrapper ? Number(roundWrapper.dataset.round) : 1;

      const scoresKey = getScoresKey(roundNumber, tableIndex);
      const savedScores = JSON.parse(localStorage.getItem(scoresKey) || '{}');

      rows.forEach((tr, rowIndex) => {
        const cells = tr.querySelectorAll('td');
        const scoreInputs = [];

        for (let j = 1; j < cells.length; j++) {
          const td = cells[j];
          td.innerHTML = '';
          const input = document.createElement('input');
          input.type = 'number';
          input.min = '0';
          input.className = 'score-input';
          // Restore saved score if exists
          if (savedScores[rowIndex] && savedScores[rowIndex][j - 1] !== undefined) {
            input.value = savedScores[rowIndex][j - 1];
          }
          td.appendChild(input);
          scoreInputs.push(input);
        }

        let totalDisplay = tr.querySelector('.score-total');
        if (!totalDisplay) {
          totalDisplay = document.createElement('span');
          totalDisplay.className = 'score-total';
          tr.appendChild(totalDisplay);
        }

        function updateTotal() {
          let sum = scoreInputs.reduce((acc, inp) => acc + (parseInt(inp.value) || 0), 0);
          scoreInputs.forEach(inp => inp.classList.remove('over-limit-cell', 'blank-cell'));

          if (sum > 100) {
            totalDisplay.textContent = '= 100pts';
            totalDisplay.classList.add('over-limit', 'shake');
            scoreInputs.forEach(inp => { if ((parseInt(inp.value) || 0) > 0) inp.classList.add('over-limit-cell'); });
            setTimeout(() => totalDisplay.classList.remove('shake'), 500);
          } else {
            totalDisplay.textContent = `= ${sum}pts`;
            totalDisplay.classList.remove('over-limit');
          }

          // Save scores to localStorage
          savedScores[rowIndex] = scoreInputs.map(i => parseInt(i.value) || 0);
          localStorage.setItem(scoresKey, JSON.stringify(savedScores));
        }

        scoreInputs.forEach(inp => {
          inp.addEventListener('input', () => {
            inp.value = inp.value.replace(/[^0-9]/g, '');
            updateTotal();
          });
        });

        // Initialize totals
        updateTotal();
      });

      // =======================
      // SUBMIT BUTTON + STATE
      // =======================
      const tableEl = tbody.closest('table');
      if (!tableEl) return;

      const tableContainer = tableEl.closest('.judge-table-container') || tableEl.parentElement;
      if (tableContainer && !tableContainer.querySelector('.submit-scores-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'submit-scores-wrapper mt-3 flex items-center gap-3 justify-end';

        const submittedBadge = document.createElement('span');
        submittedBadge.className = 'submitted-badge text-sm font-semibold text-green-700 hidden';
        submittedBadge.textContent = 'Submitted';

        const submitBtn = document.createElement('button');
        submitBtn.className = 'submit-scores-btn px-4 py-2 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700';
        submitBtn.type = 'button';
        submitBtn.textContent = 'Submit Scores';

        if (!tableEl.id) tableEl.id = `judge-table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        wrapper.appendChild(submittedBadge);
        wrapper.appendChild(submitBtn);
        tableContainer.appendChild(wrapper);

        const submissionKey = getSubmissionKey(roundNumber, tableIndex);
        if (localStorage.getItem(submissionKey) === 'true') {
          markTableAsSubmitted(tableEl, submitBtn, submittedBadge);
        }

        submitBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openSubmitModalForTable(tableEl, submitBtn, submittedBadge, submissionKey);
        });
      }
    });

    // =======================
    // ADD IMAGES + HELP ICONS
    // =======================
    roundsData.forEach(round => {
      let roundContainer = container.querySelector(`#round-${round.roundNumber}`);
      if (!roundContainer) {
        roundContainer = document.createElement('div');
        roundContainer.id = `round-${round.roundNumber}`;
        roundContainer.className = 'round-container mb-4';
        container.appendChild(roundContainer);
      }

      let iconWrapper = roundContainer.querySelector('.icon-wrapper');
      if (!iconWrapper) {
        iconWrapper = document.createElement('div');
        iconWrapper.className = 'flex items-center gap-2 justify-end mb-2 icon-wrapper';
        roundContainer.prepend(iconWrapper);
      }
    });

    // =======================
    // RENDER CONTESTANT CARDS
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

    bindCriteriaModal(container);
    initImagesModal(container);
  }

  // =======================
  // SUBMIT MODAL LOGIC
  // =======================
  let currentModalContext = null;

  function ensureSubmitModalExists() {
    let modal = document.getElementById('submitScoresModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'submitScoresModal';
    modal.className = 'modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="modal-card bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Submit Scores</h2>
          <button id="closeSubmitModal" class="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div id="submitModalBody" class="mb-4 text-sm text-gray-700">
          Are you sure you want to submit these scores? This action will lock the table.
        </div>
        <div id="submitModalWarning" class="mb-4 text-sm text-red-600 hidden"></div>
        <div class="flex justify-end gap-3">
          <button id="cancelSubmit" class="px-4 py-2 bg-gray-200 rounded font-semibold">Cancel</button>
          <button id="confirmSubmit" class="px-4 py-2 bg-indigo-600 text-white rounded font-semibold">Yes, submit</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => { if (e.target === modal) hideSubmitModal(); });
    modal.querySelector('#closeSubmitModal').addEventListener('click', hideSubmitModal);
    modal.querySelector('#cancelSubmit').addEventListener('click', hideSubmitModal);
    return modal;
  }

  function openSubmitModalForTable(tableEl, submitBtn, submittedBadge, submissionKey) {
    const modal = ensureSubmitModalExists();
    modal.querySelector('#submitModalWarning').classList.add('hidden');
    modal.querySelector('#submitModalWarning').textContent = '';
    currentModalContext = { tableEl, submitBtn, submittedBadge, submissionKey };

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);

    const confirmBtn = modal.querySelector('#confirmSubmit');
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    modal.querySelector('#confirmSubmit').addEventListener('click', handleConfirmSubmit);
  }

  function hideSubmitModal() {
    const modal = document.getElementById('submitScoresModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 200);
    currentModalContext = null;
  }

  function handleConfirmSubmit() {
    if (!currentModalContext) return;
    const { tableEl, submitBtn, submittedBadge, submissionKey } = currentModalContext;
    const tbody = tableEl.querySelector('tbody');
    const inputs = Array.from(tbody.querySelectorAll('input.score-input'));
    inputs.forEach(inp => inp.classList.remove('blank-cell'));

    const blankInputs = inputs.filter(inp => !inp.value);
    const warningEl = document.getElementById('submitScoresModal').querySelector('#submitModalWarning');

    if (blankInputs.length) {
      blankInputs.forEach(inp => inp.classList.add('blank-cell'));
      warningEl.textContent = `You have ${blankInputs.length} blank cell(s). Kindly fill all before submitting.`;
      warningEl.classList.remove('hidden');
      return;
    }

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const overLimitRows = rows.filter(row => row.querySelectorAll('input.score-input').length &&
      Array.from(row.querySelectorAll('input.score-input')).reduce((acc, i) => acc + (parseInt(i.value) || 0), 0) > 100);

    if (overLimitRows.length) {
      warningEl.textContent = `There is ${overLimitRows.length} row(s) exceeding 100 points.`;
      warningEl.classList.remove('hidden');
      overLimitRows.forEach(row => row.querySelectorAll('input.score-input').forEach(i => i.classList.add('over-limit-cell')));
      return;
    }

    markTableAsSubmitted(tableEl, submitBtn, submittedBadge);
    localStorage.setItem(submissionKey, 'true');
    hideSubmitModal();
  }

  function markTableAsSubmitted(tableEl, submitBtn, submittedBadge) {
    const tbody = tableEl.querySelector('tbody');
    tbody.querySelectorAll('input.score-input').forEach(inp => {
      inp.disabled = true;
      inp.classList.remove('blank-cell', 'over-limit-cell');
      inp.style.cursor = 'not-allowed';
    });
    tbody.querySelectorAll('.score-total').forEach(t => t.classList.add('submitted-total'));

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitted';
    submitBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
    submitBtn.classList.add('bg-green-100', 'text-green-700', 'cursor-default');
    submittedBadge.classList.remove('hidden');
  }

  // =======================
  // HELP ICON MODAL
  // =======================
  function bindCriteriaModal(container) {
    const criteriaModal = document.getElementById('criteriaModal');
    const criteriaContent = document.getElementById('criteriaContent');
    const closeBtn = document.getElementById('closeCriteriaModal');
    if (!criteriaModal || !criteriaContent || !closeBtn) return;

    if (!criteriaModal.dataset.bound) {
      closeBtn.addEventListener('click', () => criteriaModal.classList.add('hidden'));
      criteriaModal.addEventListener('click', e => { if (e.target === criteriaModal) criteriaModal.classList.add('hidden'); });
      criteriaModal.dataset.bound = 'true';
    }

    container.addEventListener('click', e => {
      const icon = e.target.closest('.help-icon');
      if (!icon) return;
      const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
      const roundIndex = parseInt(icon.dataset.round, 10) - 1;
      criteriaContent.innerHTML = '';

      if (roundsData[roundIndex]) {
        const round = roundsData[roundIndex];
        const header = document.createElement('h3');
        header.className = 'text-2xl font-bold text-indigo-600 mb-6 text-center';
        header.textContent = `Criteria for Judging (Round ${round.roundNumber})`;
        criteriaContent.appendChild(header);

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

  // =======================
  // IMAGE MODAL
  // =======================
  function initImagesModal(container) {
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

      document.getElementById('closeImagesModal').addEventListener('click', () => imagesModal.classList.add('hidden'));
      imagesModal.addEventListener('click', e => { if (e.target === imagesModal) imagesModal.classList.add('hidden'); });

      container.addEventListener('click', e => {
        const clickedImagesIcon = e.target.closest('.images-icon');
        if (!clickedImagesIcon) return;
        const roundNumber = parseInt(clickedImagesIcon.dataset.round, 10);
        const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
        const round = roundsData.find(r => r.roundNumber === roundNumber);
        if (!round) return;

        const imagesContent = document.getElementById('imagesContent');
        imagesContent.innerHTML = '';
        Object.entries(round.savedImages || {}).forEach(([id, url]) => {
          const imgWrapper = document.createElement('div');
          imgWrapper.className = 'p-1 border rounded bg-gray-50';
          imgWrapper.innerHTML = `<img src="${url}" alt="Contestant ${id}" class="w-full h-auto rounded" />`;
          imagesContent.appendChild(imgWrapper);
        });

        imagesModal.classList.remove('hidden');
      });
    }
  }

  // =======================
  // INITIAL RENDER
  // =======================
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
  // JUDGE DROPDOWN & LOGOUT
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

  judgeUserIconContainer.addEventListener('click', e => {
    e.stopPropagation();
    judgeDropdown.classList.toggle('show');
  });
  document.addEventListener('click', () => judgeDropdown.classList.remove('show'));
  logoutBtn.addEventListener('click', e => {
    e.stopPropagation();
    logoutModal.classList.add('show');
  });
  cancelLogout.addEventListener('click', () => logoutModal.classList.remove('show'));
  confirmLogout.addEventListener('click', () => {
    ['currentUser', 'currentRole', 'roundsData', 'processHTML', 'lastDeployTime'].forEach(k => localStorage.removeItem(k));
    window.location.href = 'index.html';
  });
  logoutModal.addEventListener('click', e => { if (e.target === logoutModal) logoutModal.classList.remove('show'); });
});
