// =======================
// DEPLOYING THE CONTENTS INTO JUDGE SIDE (UPDATED LAHAT NG PARTS NA TO!)
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
    // Add numeric inputs + total display to judge tables
    // =======================
    const judgeTables = container.querySelectorAll('.judge-table-container table tbody');
    judgeTables.forEach((tbody, tableIndex) => {
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        const scoreInputs = [];

        // skip first cell (contestant number)
        for (let j = 1; j < cells.length; j++) {
          const td = cells[j];
          td.innerHTML = '';
          const input = document.createElement('input');
          input.type = 'number';
          input.min = '0';
          input.className = 'score-input';
          td.appendChild(input);
          scoreInputs.push(input);
        }

        // Create total display aligned to the right (outside cells)
        let totalDisplay = tr.querySelector('.score-total');
        if (!totalDisplay) {
          totalDisplay = document.createElement('span');
          totalDisplay.className = 'score-total';
          totalDisplay.textContent = '= 0pts';
          tr.appendChild(totalDisplay);
        }

        // Update total whenever inputs change
        function updateTotal() {
          let sum = scoreInputs.reduce((acc, inp) => acc + (parseInt(inp.value) || 0), 0);

          // Reset cell warnings
          scoreInputs.forEach(inp => inp.classList.remove('over-limit-cell', 'blank-cell'));

          if (sum > 100) {
            // Cap display only, keep inputs as-is
            totalDisplay.textContent = '= 100pts';
            totalDisplay.classList.add('over-limit', 'shake');

            // highlight all cells contributing
            scoreInputs.forEach(inp => {
              if ((parseInt(inp.value) || 0) > 0) {
                inp.classList.add('over-limit-cell');
              }
            });

            // remove shake after animation
            setTimeout(() => totalDisplay.classList.remove('shake'), 500);
          } else {
            totalDisplay.textContent = `= ${sum}pts`;
            totalDisplay.classList.remove('over-limit');
          }
        }

        scoreInputs.forEach(inp => {
          inp.addEventListener('input', () => {
            inp.value = inp.value.replace(/[^0-9]/g, '');
            updateTotal();
          });
        });
      });

      // After building rows for this table, add Submit Scores button for the table
      const tableEl = tbody.closest('table');
      if (tableEl) {
        const tableContainer = tableEl.closest('.judge-table-container') || tableEl.parentElement;
        // ensure we don't add multiple buttons
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

          // store a table id for persistence (if table has no id, create one)
          if (!tableEl.id) tableEl.id = `judge-table-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          wrapper.appendChild(submittedBadge);
          wrapper.appendChild(submitBtn);
          tableContainer.appendChild(wrapper);

          // restore submitted state if saved
          const savedKey = `submitted_${tableEl.id}`;
          if (localStorage.getItem(savedKey) === 'true') {
            markTableAsSubmitted(tableEl, submitBtn, submittedBadge);
          }

          // click handler opens confirmation modal
          submitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openSubmitModalForTable(tableEl, submitBtn, submittedBadge);
          });
        }
      }
    });

    // =======================
    // Add Images + Help Icons per round
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

  // =======================
  // Submit modal creation & logic
  // =======================
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

    // close handlers
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideSubmitModal();
    });
    modal.querySelector('#closeSubmitModal').addEventListener('click', hideSubmitModal);
    modal.querySelector('#cancelSubmit').addEventListener('click', hideSubmitModal);

    return modal;
  }

  let currentModalContext = null; // { tableEl, submitBtn, submittedBadge }

  function openSubmitModalForTable(tableEl, submitBtn, submittedBadge) {
    const modal = ensureSubmitModalExists();
    const warningEl = modal.querySelector('#submitModalWarning');
    warningEl.classList.add('hidden');
    warningEl.textContent = '';

    currentModalContext = { tableEl, submitBtn, submittedBadge };
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);

    // attach confirm handler (ensure single handler)
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
    const { tableEl, submitBtn, submittedBadge } = currentModalContext;
    const tbody = tableEl.querySelector('tbody');
    const inputs = Array.from(tbody.querySelectorAll('input.score-input'));

    // Reset previous blank highlights
    inputs.forEach(inp => inp.classList.remove('blank-cell'));

    // Find blank inputs
    const blankInputs = inputs.filter(inp => inp.value === '' || inp.value === null || inp.value === undefined);

    const modal = document.getElementById('submitScoresModal');
    const warningEl = modal.querySelector('#submitModalWarning');

    if (blankInputs.length > 0) {
      // highlight blanks
      blankInputs.forEach(inp => inp.classList.add('blank-cell'));
      warningEl.textContent = `You have ${blankInputs.length} blank cell(s). Kindly fill out all required cells before re-submitting.`;
      warningEl.classList.remove('hidden');
      // keep modal open so judge can correct
      return;
    }

    // Optionally: validate totals not exceeding 100 per row
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const overLimitRows = rows.filter(row => {
      const rowInputs = Array.from(row.querySelectorAll('input.score-input'));
      const sum = rowInputs.reduce((acc, i) => acc + (parseInt(i.value) || 0), 0);
      return sum > 100;
    });
    if (overLimitRows.length > 0) {
      warningEl.textContent = `There is ${overLimitRows.length} row(s) that exceeds to 100 points. Kindly review it before re-submitting.`;
      warningEl.classList.remove('hidden');
      // highlight inputs in those rows
      overLimitRows.forEach(row => {
        row.querySelectorAll('input.score-input').forEach(i => i.classList.add('over-limit-cell'));
      });
      return;
    }
    

    // If all good, mark as submitted: disable inputs, change button to Submitted
    markTableAsSubmitted(tableEl, submitBtn, submittedBadge);

    // persist submitted state
    const savedKey = `submitted_${tableEl.id}`;
    localStorage.setItem(savedKey, 'true');

    hideSubmitModal();
  }

  function markTableAsSubmitted(tableEl, submitBtn, submittedBadge) {
  const tbody = tableEl.querySelector('tbody');
  const inputs = Array.from(tbody.querySelectorAll('input.score-input'));
  inputs.forEach(inp => {
    inp.disabled = true;
    inp.classList.remove('blank-cell', 'over-limit-cell');
    inp.style.cursor = 'not-allowed';
  });

  // color all totals green (add submitted-total class)
  const totals = Array.from(tbody.querySelectorAll('.score-total'));
  totals.forEach(t => {
    t.classList.add('submitted-total');
  });

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitted';
  submitBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
  submitBtn.classList.add('bg-green-100', 'text-green-700', 'cursor-default');
  submittedBadge.classList.remove('hidden');

  // hide overlimit badge if present
  const wrapper = submitBtn.closest('.submit-scores-wrapper');
  if (wrapper) {
    const overBadge = wrapper.querySelector('.overlimit-count-badge');
    if (overBadge) overBadge.classList.add('hidden');
  }
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
});
