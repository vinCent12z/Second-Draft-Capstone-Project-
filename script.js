// =======================
// ELEMENTS
// =======================
const navLinks = document.querySelectorAll('nav a');
const processBtn = document.getElementById('processBtn');
const pages = document.querySelectorAll('.page');
const processContainer = document.getElementById('processContainer');
const processForm = document.getElementById('processForm');
const helpIcon = document.getElementById('helpIcon');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');
const customizeBtn = document.getElementById('customizeBtn');
const customizeModal = document.getElementById('customizeModal');
const closeCustomize = document.getElementById('closeCustomize');
const cancelCustomize = document.getElementById('cancelCustomize');
const saveCustomize = document.getElementById('saveCustomize');
const editBtn = document.getElementById('editCriteriaBtn');
const addCriteriaBtn = document.getElementById('addCriteriaBtn');
const criteriaList = document.getElementById('criteriaList');
const criteriaEditForm = document.getElementById('criteriaEditForm');
const criteriaActions = document.getElementById('criteriaActions');
const saveBtn = document.getElementById('saveCriteriaBtn');
const cancelBtn = document.getElementById('cancelCriteriaBtn');
const saveMessage = document.getElementById('criteriaSaveMessage');
const contestantTableHeader = document.getElementById('contestantTableHeader');
const tableBody = document.getElementById('tableBody');
const insertPhotoBtn = document.getElementById('insertPhotoBtn');
const processImageGallery = document.getElementById('processImageGallery');
const finalizationModal = document.getElementById('finalizationModal');
const closeFinalization = document.getElementById('closeFinalization');
const backFinalize = document.getElementById('backFinalize');
const confirmFinalize = document.getElementById('confirmFinalize');
const finalJudgeNumber = document.getElementById('finalJudgeNumber');
const judgeListContainer = document.getElementById('judgeListContainer');
const deployBtn = document.getElementById('deployBtn');
const contestantNumberInput = document.getElementById('customContestantNumber');
const manualAddRoundBtn = document.getElementById('manualAddRoundBtn');
const addRoundYes = document.getElementById('addRoundYes');
const addRoundNo = document.getElementById('addRoundNo');
const addRoundModal = document.getElementById('addRoundModal');

// Admin dropdown elements
const adminUserIconContainer = document.getElementById('adminUserIconContainer');
const adminDropdown = document.getElementById('adminDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const confirmLogout = document.getElementById('confirmLogout');
const cancelLogout = document.getElementById('cancelLogout');

// Admin Restrictions
const currentUser = localStorage.getItem("currentUser");
const currentRole = localStorage.getItem("currentRole");
if (!currentUser || currentRole !== "admin") {
  alert("Unauthorized access. Please login as admin.");
  window.location.href = "index.html";
}

// Remove button for criteria (dynamic)
const removeCriteriaBtn = document.createElement("button");
removeCriteriaBtn.id = "removeCriteriaBtn";
removeCriteriaBtn.textContent = "Remove Criteria";
removeCriteriaBtn.className = "px-6 py-2 bg-red-500 text-white rounded-xl shadow hover:bg-red-600 transition ml-auto interactive-btn";
removeCriteriaBtn.style.display = "none";

// =======================
// STATE
// =======================
pages.forEach(p => p.classList.add('hidden'));
document.getElementById('dashboard').classList.remove('hidden');
processForm.style.display = 'none';
helpIcon.style.display = 'none';
addCriteriaBtn.style.display = 'none';
if (processImageGallery) processImageGallery.style.display = 'none';
processContainer.classList.remove('active');

let tempImages = {};   //  Only current round ephemeral images
let savedImages = {};  //  Current round finalized images
let rounds = [];       //  Array of finalized rounds

let lastContestantCount = null;

// =======================
// RESET INSERTED PHOTOS WHEN CONTESTANT NUMBER CHANGES
// =======================
contestantNumberInput.addEventListener('change', () => {
  const newCount = parseInt(contestantNumberInput.value, 10);
  if (!newCount || newCount <= 0 || newCount === lastContestantCount) return;

  //  Reset only current round ephemeral images
  tempImages = {};

  // Clear only the current round gallery section (if exists)
  const currentRoundGallery = document.querySelector(`.round-gallery-section[data-round='${currentRound.roundNumber}']`);
  if (currentRoundGallery) {
    currentRoundGallery.remove();
  }

  lastContestantCount = newCount;
  console.log(`Contestant number changed to ${newCount}. Current round images reset.`);
});

window.totalJudges = 0;
let judgeNames = [];
let currentRound = {
  roundNumber: 1,
  savedImages: {},
  eventName: '',
  totalContestants: 0,
  criteriaCount: 0,
  judges: []
};
let isFirstRoundFinalized = false;
let allowEditVisible = false;
let isEditingCriteria = false;
let disableMainHelpModal = false;


// =======================
// SPA NAVIGATION
// =======================
function showPage(targetId) {
  pages.forEach(p => p.classList.add('hidden'));
  processForm.style.display = 'none';
  helpIcon.style.display = 'none';
  if (processImageGallery) processImageGallery.style.display = 'none';

  const targetPage = document.getElementById(targetId);
  if (targetPage) targetPage.classList.remove('hidden');

  if (targetId === 'processContainer') {
    processForm.style.display = 'block';
    if (!disableMainHelpModal) helpIcon.style.display = 'flex';
    if ((Object.keys(savedImages).length > 0) || rounds.length > 0) {
      processImageGallery.style.display = 'flex';
      processImageGallery.style.flexDirection = 'column';
    }
    if (isFirstRoundFinalized) {
      manualAddRoundBtn.style.display = 'inline-block';
      deployBtn.style.display = 'inline-block';
    } else {
      manualAddRoundBtn.style.display = 'none';
      deployBtn.style.display = 'none';
    }
  } else {
    manualAddRoundBtn.style.display = 'none';
    deployBtn.style.display = 'none';
  }
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showPage(link.getAttribute('href').replace('#',''));
  });
});
processBtn.addEventListener('click', () => showPage('processContainer'));


// =======================
// TABLE MANAGEMENT
// =======================
function syncTableHeaders() {
  const titles = Array.from(criteriaList.querySelectorAll('.criteria-title')).map(el => el.textContent.trim());
  let headerHTML = '<th style="min-width:80px">Contestant No.</th>';
  titles.forEach(title => headerHTML += `<th style="min-width:80px">${title}</th>`);
  contestantTableHeader.innerHTML = `<tr>${headerHTML}</tr>`;
}

function updateTable() {
  syncTableHeaders();
  const criteriaCount = criteriaList.querySelectorAll('.criteria-title').length;
  for (let row of tableBody.children) {
    while (row.children.length > criteriaCount + 1) row.removeChild(row.lastChild);
    for (let j = row.children.length - 1; j < criteriaCount; j++) {
      const td = document.createElement('td');
      td.textContent = '';
      td.style.height = '1.6rem';
      td.style.textAlign = 'center';
      row.appendChild(td);
    }
  }
  lockMainTableLayout();
  if (isEditingCriteria) adjustTableColumnWidths();
}

function lockMainTableLayout() {
  const table = document.getElementById('contestantTable');
  if (!table) return;
  table.style.tableLayout = 'fixed';
  table.style.width = 'auto';
  table.querySelectorAll('th').forEach(th => {
    th.style.minWidth = '80px';
    th.style.textAlign = 'center';
    th.style.boxSizing = 'border-box';
  });
  table.querySelectorAll('td').forEach(td => {
    td.style.height = '1.6rem';
    td.style.textAlign = 'center';
    td.style.boxSizing = 'border-box';
  });
}

function adjustTableColumnWidths() {
  if (!isEditingCriteria) return;
  const table = document.getElementById('contestantTable');
  if (!table) return;
  table.style.tableLayout = 'auto';
  requestAnimationFrame(() => { table.style.width = '100%'; });
}
window.addEventListener('resize', adjustTableColumnWidths);

// =======================
// TEXTAREA AUTO-RESIZE
// =======================
function setupTextareaResize(textarea) {
  textarea.style.width='100%';
  textarea.style.minWidth='300px';
  textarea.style.boxSizing='border-box';
  textarea.style.resize='vertical';
  textarea.style.overflow='hidden';
  const resize = () => { textarea.style.height='auto'; textarea.style.height=textarea.scrollHeight+'px'; };
  setTimeout(resize,10);
  textarea.addEventListener('input',resize);
  resize();
}


// =======================
// EDIT CRITERIA MODAL
// =======================
if (editBtn) {
  editBtn.addEventListener('click', openEditCriteria);

  function openEditCriteria(){
    isEditingCriteria = true;
    criteriaList.classList.add("hidden");
    editBtn.style.display = 'none';
    editBtn.classList.add("hidden");
    criteriaEditForm.classList.remove("hidden");
    criteriaActions.classList.remove("hidden");
    criteriaEditForm.innerHTML='';

    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = "criteriaButtons";
    buttonsContainer.className = "flex gap-2 mt-2";
    buttonsContainer.appendChild(addCriteriaBtn);
    buttonsContainer.appendChild(removeCriteriaBtn);
    criteriaEditForm.appendChild(buttonsContainer);

    addCriteriaBtn.style.display='inline-flex';
    removeCriteriaBtn.style.display='inline-flex';

    const titles = criteriaList.querySelectorAll("p.criteria-title");
    const subs = criteriaList.querySelectorAll("ul.criteria-sublist");
    titles.forEach((titleEl,i)=>{
      const subText = Array.from(subs[i].querySelectorAll("li")).map(li=>li.textContent).join("\n");
      addCriteriaPair(titleEl.textContent, subText);
    });
  }

// UPDATED CODE FOR CRITERIA FOR JUDGING //
 function addCriteriaPair(title = "", sublist = "") {
  const pairDiv = document.createElement('div');
  pairDiv.className = 'criteria-pair';
  
  // CRITICAL: Force block-level display to prevent side-by-side
  pairDiv.style.display = 'flex';
  pairDiv.style.flexDirection = 'column';
  pairDiv.style.width = '100%';
  pairDiv.style.maxWidth = '100%';
  pairDiv.style.marginBottom = '1.25rem';
  pairDiv.style.float = 'none';  // Prevent floating
  pairDiv.style.clear = 'both';  // Clear any floats
  
  const titleTA = document.createElement('textarea');
  titleTA.placeholder = "Main Criteria Title (e.g., Beauty 40%)";
  titleTA.dataset.type = 'title';
  titleTA.value = title;
  titleTA.style.width = '100%';
  titleTA.style.boxSizing = 'border-box';
  setupTextareaResize(titleTA);

  const subTA = document.createElement('textarea');
  subTA.placeholder = "Sublist items (one per line)";
  subTA.dataset.type = 'sublist';
  subTA.value = sublist;
  subTA.style.width = '100%';
  subTA.style.boxSizing = 'border-box';
  setupTextareaResize(subTA);

  pairDiv.appendChild(titleTA);
  pairDiv.appendChild(subTA);

  const container = document.getElementById('criteriaButtons');
  if (container) {
      criteriaEditForm.insertBefore(pairDiv, container);
  } else {
      criteriaEditForm.appendChild(pairDiv);
  }
  
  criteriaEditForm.scrollTop = criteriaEditForm.scrollHeight;
}

  addCriteriaBtn.onclick = () => addCriteriaPair();
  removeCriteriaBtn.onclick = () => {
    const pairs = criteriaEditForm.querySelectorAll(".criteria-pair");
    if (pairs.length>0) pairs[pairs.length-1].remove();
  };
  saveBtn.onclick = saveCriteria;
  cancelBtn.onclick = closeEditCriteria;

  function saveCriteria(){
  const pairs = criteriaEditForm.querySelectorAll(".criteria-pair");
  criteriaList.innerHTML = '';

  pairs.forEach(pair=>{
    const title = pair.querySelector("textarea[data-type='title']").value.trim() || "New Criteria";
    const subText = pair.querySelector("textarea[data-type='sublist']").value;

    // Create wrapper block so we can later parse items easily
    const block = document.createElement("div");
    block.className = "criteria-block";

    const p = document.createElement("p");
    p.classList.add("criteria-title");
    p.textContent = title;

    const ul = document.createElement("ul");
    ul.classList.add("criteria-sublist");
    subText.split(/\n/).forEach(line=>{
      if(line.trim()!==""){
        const li = document.createElement("li");
        li.textContent = line.trim();
        ul.appendChild(li);
      }
    });

    block.appendChild(p);
    block.appendChild(ul);
    criteriaList.appendChild(block);
  });

  updateTable();
  closeEditCriteria();

  if (currentRound.roundNumber > 1) {
    helpModal.classList.remove('show');
    helpModal.classList.add('hidden');

    customizeModal.classList.remove('hidden');
    setTimeout(() => customizeModal.classList.add('show'), 10);
  } else {
    saveMessage.classList.remove("opacity-0");
    setTimeout(() => saveMessage.classList.add("opacity-0"), 2000);
  }
}


  function closeEditCriteria(){
    isEditingCriteria = false;
    criteriaEditForm.innerHTML='';
    criteriaEditForm.classList.add("hidden");
    criteriaActions.classList.add("hidden");
    addCriteriaBtn.style.display='none';
    removeCriteriaBtn.style.display='none';
    criteriaList.classList.remove("hidden");

    if (editBtn) {
      if (allowEditVisible) {
        const helpContent = document.querySelector('#helpModal .modal-content');
        if (helpContent && editBtn.parentElement !== helpContent) helpContent.appendChild(editBtn);
        editBtn.style.display = 'inline-flex';
        editBtn.classList.remove('hidden');
      } else {
        editBtn.style.display = 'none';
        editBtn.classList.remove('hidden');
      }
    }
  }
}
// UPDATED CODE IN JUDGE CRITERIA REMOVE ROUNDS
// =======================
// HELP MODAL
// =======================
helpIcon.addEventListener('click', () => {
  const modalTitle = helpModal.querySelector('h3');
  if (modalTitle) modalTitle.textContent = 'Criteria for Judging'; 
  helpModal.classList.add('show');
});
closeHelp.addEventListener('click', () => helpModal.classList.remove('show'));

// =======================
// CUSTOMIZE MODAL & IMAGE LOGIC
// =======================
customizeBtn.addEventListener('click', ()=>{
  customizeModal.classList.add('show');
  customizeModal.classList.remove('hidden');

  document.getElementById('customEventName').value='';

  const currentTableCount = tableBody.children.length;
  const savedCount = Object.keys(savedImages).length;
  document.getElementById('customContestantNumber').value = currentTableCount || savedCount || '';

  document.getElementById('customJudgeNumber').value = window.totalJudges > 0 ? window.totalJudges : '';

  tempImages = Object.assign({}, savedImages);
});

function closeCustomizeModal() {
  customizeModal.classList.remove('show');
  setTimeout(() => customizeModal.classList.add('hidden'), 150);
}
[closeCustomize, cancelCustomize].forEach(btn => btn.addEventListener('click', closeCustomizeModal));

// =======================
// SAVE CUSTOMIZE
// =======================
saveCustomize.addEventListener('click', ()=>{
  const eventName = document.getElementById("customEventName").value.trim();
  const contestantNum = parseInt(document.getElementById("customContestantNumber").value.trim());
  const judgeNum = parseInt(document.getElementById("customJudgeNumber").value.trim());
  let missing = [];
  if(!eventName) missing.push("Event Name");
  if(!contestantNum||contestantNum<=0) missing.push("Number of Contestants");
  if(!judgeNum||judgeNum<=0) missing.push("Number of Judges");
  if(missing.length>0){ alert(` Please fill: ${missing.join(", ")}`); return; }

  const totalImages = Object.keys(tempImages).length;
  if(totalImages !== contestantNum){ alert(` Assign exactly ${contestantNum} images. Currently: ${totalImages}`); return; }

  window.totalJudges = judgeNum;

  const mainTableBody = document.getElementById('tableBody');
  mainTableBody.innerHTML = '';
  const criteriaCount = criteriaList.querySelectorAll('.criteria-title').length;
  for (let i = 1; i <= contestantNum; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}</td>`;
    for (let j = 0; j < criteriaCount; j++) {
      const td = document.createElement('td');
      td.textContent = '';
      td.style.textAlign = 'center';
      td.style.height = '1.4rem';
      tr.appendChild(td);
    }
    mainTableBody.appendChild(tr);
  }
  updateTable();
  lockMainTableLayout();

  closeCustomizeModal();
  openFinalizationModal();
});

// =======================
// INSERT PHOTO LOGIC (NO DUPLICATES PER ROUND)
// =======================
insertPhotoBtn.addEventListener('click', () => {
  const totalContestants = parseInt(document.getElementById('customContestantNumber').value);

  if (isNaN(totalContestants) || totalContestants <= 0) {
    alert("Enter number of contestants first.");
    return;
  }

  let nextNum = 1;
  while (nextNum <= totalContestants && tempImages[nextNum]) nextNum++;

  if (nextNum > totalContestants) {
    alert("All contestants already have images.");
    return;
  }

  const targetStr = prompt(
    `Assign image to contestant number (1-${totalContestants}):`,
    nextNum
  );
  if (targetStr === null) return;

  const targetNum = parseInt(targetStr);
  if (isNaN(targetNum) || targetNum < 1 || targetNum > totalContestants) {
    alert(`Invalid number.`);
    return;
  }

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.click();

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const imageData = ev.target.result;

      //  DUPLICATE CHECK — CURRENT ROUND ONLY
      const alreadyUsed = Object.values(tempImages).includes(imageData);
if (alreadyUsed) {
  alert(" This photo is already used in the current round. Please choose a different image.");
  return;
}


      tempImages[targetNum] = imageData;
      alert(` Photo assigned to Contestant #${targetNum}. Click 'Save' to confirm.`);
    };

    reader.readAsDataURL(file);
  });
});

// =======================
// Helper: clone table and lock computed widths/minWidths (pixel-accurate)
// =======================
function cloneTableWithFixedStyle(sourceTable) {
  // Ensure source is in DOM and visible for accurate measurement
  if (!document.body.contains(sourceTable)) {
    document.body.appendChild(sourceTable);
  }

  // Force reflow so computed sizes are stable
  sourceTable.style.visibility = 'visible';
  void sourceTable.offsetHeight;

  // Measure header cells (pixel widths)
  const sourceThs = Array.from(sourceTable.querySelectorAll('th'));
  const thWidths = sourceThs.map(th => {
    const r = th.getBoundingClientRect();
    return Math.max(1, Math.round(r.width)); // integer px
  });

  // Measure whole table width
  const tableRect = sourceTable.getBoundingClientRect();
  const tableWidthPx = Math.max(1, Math.round(tableRect.width));

  // Clone node structure
  const clone = sourceTable.cloneNode(true);
  clone.id = '';

  // Ensure thead exists in clone
  if (!clone.querySelector('thead')) {
    const srcThead = sourceTable.querySelector('thead');
    if (srcThead) {
      const thead = document.createElement('thead');
      thead.innerHTML = srcThead.innerHTML;
      clone.insertBefore(thead, clone.firstChild);
    }
  }

  // Apply explicit pixel widths to cloned header cells
  const cloneThs = Array.from(clone.querySelectorAll('th'));
  cloneThs.forEach((th, idx) => {
    const w = thWidths[idx] || thWidths[0] || 100;
    th.style.width = w + 'px';
    th.style.minWidth = w + 'px';
    th.style.boxSizing = 'border-box';
  });

  // If source has colgroup, clone and set widths there too
  const srcColGroup = sourceTable.querySelector('colgroup');
  if (srcColGroup) {
    let cloneColGroup = clone.querySelector('colgroup');
    if (!cloneColGroup) {
      cloneColGroup = document.createElement('colgroup');
      clone.insertBefore(cloneColGroup, clone.firstChild);
    } else {
      cloneColGroup.innerHTML = '';
    }
    thWidths.forEach(w => {
      const col = document.createElement('col');
      col.style.width = w + 'px';
      cloneColGroup.appendChild(col);
    });
  }

  // Lock table sizing
  clone.style.tableLayout = 'fixed';
  clone.style.width = tableWidthPx + 'px';
  clone.style.minWidth = tableWidthPx + 'px';
  clone.style.display = 'block';
  clone.style.boxSizing = 'border-box';

  return clone;
}

function ensureRoundsContainer() {
  let roundsContainer = document.getElementById('roundsContainer');
  if (!roundsContainer) {
    roundsContainer = document.createElement('div');
    roundsContainer.id = 'roundsContainer';

    // Flex column with gap
    roundsContainer.style.display = 'flex';
    roundsContainer.style.flexDirection = 'column';
    roundsContainer.style.gap = '2rem'; // primary spacing
    roundsContainer.style.marginTop = '1.5rem';
    roundsContainer.style.width = '100%'; // make sure it stretches

    processForm.appendChild(roundsContainer);
  }
  return roundsContainer;
}

// UPDATED 
// =======================
// CREATE ROUND WRAPPER (FIXED)
// =======================
function createRoundWrapperAndMoveJudgeCards(roundNumber, judgeCards) {
  const roundsContainer = ensureRoundsContainer();

  const roundWrapper = document.createElement('div');
  roundWrapper.className = 'rounded-xl shadow-lg p-4 bg-gray-50';
  roundWrapper.style.border = '2px solid #6366f1';

  const headerRow = document.createElement('div');
  headerRow.className = 'flex items-center justify-between mb-4';
  
  const roundTitle = document.createElement('h1');
  
  //  KEEP "ROUND X" for admin view
  roundTitle.textContent = `ROUND ${roundNumber}`; 
  
  roundTitle.className = 'text-2xl font-bold text-indigo-600';
  headerRow.appendChild(roundTitle);

  roundWrapper.appendChild(headerRow);

  const thisRoundJudgesContainer = document.createElement('div');
  thisRoundJudgesContainer.className = 'flex flex-col items-center gap-6';
  roundWrapper.appendChild(thisRoundJudgesContainer);

  judgeCards.forEach(card => thisRoundJudgesContainer.appendChild(card));

  roundsContainer.appendChild(roundWrapper);

  const working = document.getElementById('judgesTablesContainer');
  if (working) working.innerHTML = '';

  return roundWrapper;
}

// =======================
// OPEN/CLOSE FINALIZATION MODAL
// =======================
function openFinalizationModal() {
  finalizationModal.classList.remove('hidden');
  setTimeout(() => finalizationModal.classList.add('show'), 10);

  const container = document.getElementById('judgeListContainer');
  container.innerHTML = '';

  for (let i = 1; i <= window.totalJudges; i++) {
    const div = document.createElement('div');
    div.className = 'flex flex-col items-start gap-1';

    const label = document.createElement('label');
    label.textContent = `Judge Number ${i}`;
    label.className = 'font-semibold text-gray-700';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Enter Judge ${i} Name`;
    input.className = 'border rounded-md p-2 w-full';
    input.dataset.required = 'true';

    const error = document.createElement('p');
    error.className = 'text-red-600 text-sm opacity-0 transition-opacity duration-300';
    error.textContent = 'Judge name is required';

    div.appendChild(label);
    div.appendChild(input);
    div.appendChild(error);

    container.appendChild(div);
  }
}
function closeFinalizationModal() {
  finalizationModal.classList.remove('show');
  setTimeout(() => finalizationModal.classList.add('hidden'), 300);
}

closeFinalization.addEventListener('click', closeFinalizationModal);
backFinalize.addEventListener('click', () => {
  closeFinalizationModal();
  setTimeout(() => {
    customizeModal.classList.remove('hidden');
    setTimeout(() => customizeModal.classList.add('show'), 10);
  }, 350);
});

// =======================
// FINALIZE TABULATION (updated with per-round synced help icons)
// =======================

// Store criteria HTML per round to keep help modal in sync
const roundsMeta = {}; // { [roundNumber]: { criteriaHTML, eventName } }

confirmFinalize.addEventListener('click', () => {
  const judgeInputs = document.querySelectorAll('#judgeListContainer input');
  let allValid = true;

  // Validate judge names
  judgeInputs.forEach(input => {
    const error = input.nextElementSibling;
    if (!input.value.trim()) {
      error.classList.remove('opacity-0');
      error.classList.add('opacity-100');
      allValid = false;
    } else {
      error.classList.remove('opacity-100');
      error.classList.add('opacity-0');
    }
  });

  if (!allValid) {
    alert(' Please fill in all judge names before finalizing.');
    return;
  }

  // Collect judge names
  judgeNames = Array.from(judgeInputs).map(input => input.value.trim());
  window.totalJudges = judgeNames.length;

  const eventNameInput = document.getElementById('customEventName');
  const contestantNumberInput = document.getElementById('customContestantNumber');

  // Fallback to number of assigned images if contestant number is empty
  let totalContestants = parseInt(contestantNumberInput.value, 10);
  if (isNaN(totalContestants) || totalContestants <= 0) {
    totalContestants = Object.keys(tempImages).length;
  }

  const criteriaCount = criteriaList.querySelectorAll('.criteria-title').length || 0;

  // Snapshot round context
  const roundNumber = currentRound.roundNumber;
  const criteriaSnapshotHTML = criteriaList.innerHTML;
  const eventNameSnapshot = eventNameInput.value || '';
  roundsMeta[roundNumber] = { criteriaHTML: criteriaSnapshotHTML, eventName: eventNameSnapshot };

  // Display event name
  const eventNameDisplay = document.getElementById('eventNameDisplay');
  if (eventNameDisplay) eventNameDisplay.textContent = eventNameSnapshot;

  const baseTable = document.getElementById('contestantTable');
  const judgeCards = [];

  // Table sizing
  const perColumnMin = 120;
  const tableMinWidth = perColumnMin * (criteriaCount + 1);

  // Build judge cards
  judgeNames.forEach((judge, index) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-4 judge-table-container';
    card.dataset.judge = index + 1;
    card.dataset.round = String(roundNumber); //  critical
    card.style.width = '100%';
    card.style.boxSizing = 'border-box';
    card.style.position = 'relative';

    // Event header
    const eventHeader = document.createElement('h2');
    eventHeader.textContent = eventNameSnapshot;
    eventHeader.className = 'text-lg font-bold text-center mb-2';
    card.appendChild(eventHeader);

    // Scroll wrapper
    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'judge-table-scroll';
    scrollWrap.style.overflowX = 'auto';
    scrollWrap.style.width = '100%';
    card.appendChild(scrollWrap);

    // Clone base table
    const newTable = baseTable ? cloneTableWithFixedStyle(baseTable) : document.createElement('table');
    newTable.id = '';

    let tbody = newTable.querySelector('tbody');
    if (!tbody) {
      tbody = document.createElement('tbody');
      newTable.appendChild(tbody);
    }
    tbody.innerHTML = '';

    for (let i = 1; i <= totalContestants; i++) {
      const tr = document.createElement('tr');
      const tdIndex = document.createElement('td');
      tdIndex.textContent = i;
      tdIndex.style.textAlign = 'center';
      tdIndex.style.minWidth = perColumnMin + 'px';
      tdIndex.style.boxSizing = 'border-box';
      tr.appendChild(tdIndex);

      for (let j = 0; j < criteriaCount; j++) {
        const td = document.createElement('td');
        td.textContent = '';
        td.style.textAlign = 'center';
        td.style.minWidth = perColumnMin + 'px';
        td.style.height = '1.4rem';
        td.style.boxSizing = 'border-box';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    newTable.querySelectorAll('th').forEach(th => {
      th.style.minWidth = perColumnMin + 'px';
      th.style.textAlign = 'center';
      th.style.boxSizing = 'border-box';
    });

    newTable.style.tableLayout = 'fixed';
    newTable.style.display = 'block';
    newTable.style.minWidth = tableMinWidth + 'px';
    newTable.style.boxSizing = 'border-box';

    scrollWrap.appendChild(newTable);

    // Footer
    const judgeFooter = document.createElement('div');
    judgeFooter.className = 'judge-footer mt-3 text-center';
    const judgeNameLine = document.createElement('p');
    judgeNameLine.textContent = `APPROVED AND VERIFIED BY: ${judge}`;
    judgeNameLine.style.fontWeight = '600';
    judgeNameLine.style.color = '#4f46e5';
    judgeNameLine.style.margin = '0';
    const judgeNumberLine = document.createElement('p');
    judgeNumberLine.textContent = `JUDGE NO. ${index + 1}`;
    judgeNumberLine.style.fontWeight = '600';
    judgeNumberLine.style.color = '#4f46e5';
    judgeNumberLine.style.margin = '0';
    judgeFooter.appendChild(judgeNameLine);
    judgeFooter.appendChild(judgeNumberLine);
    card.appendChild(judgeFooter);

    //  Add help icon per judge card, bound to round/judge
    const judgeHelpIcon = document.createElement('button');
    judgeHelpIcon.className = 'help-icon absolute top-2 right-2 bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-blue-700 transition';
    judgeHelpIcon.textContent = '?';
    judgeHelpIcon.title = `Help for Round ${roundNumber}, Judge ${index + 1}`;
    judgeHelpIcon.dataset.round = String(roundNumber);
    judgeHelpIcon.dataset.judge = String(index + 1);
    card.appendChild(judgeHelpIcon);

    judgeHelpIcon.addEventListener('click', () => {
      const r = parseInt(judgeHelpIcon.dataset.round, 10);
      const j = parseInt(judgeHelpIcon.dataset.judge, 10);

      // Restore criteria snapshot for this round
      const meta = roundsMeta[r];
      if (meta && typeof meta.criteriaHTML === 'string') {
        criteriaList.innerHTML = meta.criteriaHTML;
      }

      const modalTitle = helpModal.querySelector('h3');
      if (modalTitle) {
        modalTitle.textContent = `Criteria for Judging`;
      }

      helpModal.classList.remove('hidden');
      setTimeout(() => helpModal.classList.add('show'), 10);
    });

    judgeCards.push(card);
  });

  // Create round wrapper and get reference (ensure the helper returns the wrapper)
  const roundWrapper = createRoundWrapperAndMoveJudgeCards(currentRound.roundNumber, judgeCards);

  // Hide per-card customize buttons
  document.querySelectorAll('.judge-table-container .customize-btn').forEach(btn => btn.style.display = 'none');

  // =========================
  // SAVE IMAGES FOR THIS ROUND
  // =========================
  const roundImages = {};
  Object.keys(tempImages).forEach(k => {
    const num = parseInt(k, 10);
    if (!isNaN(num) && num >= 1 && num <= totalContestants) {
      roundImages[num] = tempImages[k];
    }
  });
  savedImages = roundImages;

  // =========================
  // RIGHT-SIDE PER-ROUND GALLERY — stacked per round, fixed 3 columns per row
  // =========================
  processImageGallery.style.display = 'flex';
  processImageGallery.style.flexDirection = 'column';
  processImageGallery.style.alignItems = 'stretch';
  processImageGallery.style.gap = '2rem'; // spacing between rounds
  processImageGallery.style.maxHeight = '80vh';
  processImageGallery.style.overflowY = 'auto';

  // Create a section for this round
  const roundGallerySection = document.createElement('div');
  roundGallerySection.className = 'round-gallery-section'; // apply blue wrapper class
  roundGallerySection.style.width = '100%';
  roundGallerySection.style.boxSizing = 'border-box';

  // Round title
  const roundTitleRight = document.createElement('h3');
  roundTitleRight.textContent = `ROUND ${currentRound.roundNumber} Contestant Images`;
  roundGallerySection.appendChild(roundTitleRight);

  // Strict 3 columns per row
  const roundGallery = document.createElement('div');
  roundGallery.className = 'grid gap-4';
  roundGallery.style.gridTemplateColumns = 'repeat(3, 1fr)';

  // Render contestants in exact order
  const orderedNums = Object.keys(roundImages)
    .map(n => parseInt(n, 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  orderedNums.forEach(num => {
    const src = roundImages[num];
    if (!src) return;

    const card = document.createElement('div');
    card.className = 'contestant-card flex flex-col items-center text-center';

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Contestant ${num}`;
    img.style.width = '120px';
    img.style.height = '120px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '0.5rem';
    img.style.border = '1px solid #000';

    const label = document.createElement('p');
    label.className = 'contestant-label mt-1 font-semibold text-sm';
    label.textContent = `Contestant #${num}`;

    card.appendChild(img);
    card.appendChild(label);
    roundGallery.appendChild(card);
  });

  roundGallerySection.appendChild(roundGallery);

  // Append this round section ONCE to the global gallery container
  processImageGallery.appendChild(roundGallerySection);

  // =========================
  // UI updates and reset main template
  // =========================
  processContainer.classList.add('active');
  if (helpIcon) helpIcon.style.display = 'flex';
  contestantNumberInput.value = '';
  const customJudgeNumberEl = document.getElementById('customJudgeNumber');
  if (customJudgeNumberEl) customJudgeNumberEl.value = '';

  const mainTableBody = document.getElementById('tableBody');
  if (mainTableBody) {
    mainTableBody.innerHTML = '';
    for (let i = 1; i <= totalContestants; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i}</td>`;
      for (let j = 0; j < criteriaCount; j++) tr.appendChild(document.createElement('td'));
      mainTableBody.appendChild(tr);
    }
    updateTable();
    lockMainTableLayout();
  }
// Hide default main table and controls
if (baseTable) baseTable.style.display = 'none';
const mainCustomizeBtn = document.getElementById('customizeBtn');
if (mainCustomizeBtn) mainCustomizeBtn.style.display = 'none';
if (eventNameDisplay) eventNameDisplay.style.display = 'none';
if (editBtn) editBtn.style.display = 'none';

// Save round record with full criteria breakdown
rounds.push({
  roundNumber: currentRound.roundNumber,
  judges: judgeNames,
  criteriaCount,
  totalContestants,
  eventName: eventNameSnapshot, // event name syncing (admin dashboard)
  savedImages: { ...roundImages },
  criteria: Array.from(criteriaList.querySelectorAll('.criteria-title')).map(titleEl => {
    const block = titleEl.closest('.criteria-block') || titleEl.parentElement;
    const items = Array.from(block.querySelectorAll('li')).map(li => li.textContent.trim());
    return {
      name: titleEl.textContent.trim(),
      maxPoints: '',
      items
    };
  })
});

closeFinalizationModal();
alert(` Tabulation finalized successfully! Total Judges: ${window.totalJudges}`);

isFirstRoundFinalized = true;
disableMainHelpModal = true;   //  lock help modal forever
showPage('processContainer');

//  Hide the main help modal after first finalize
helpModal.classList.remove('show');
helpModal.classList.add('hidden');
helpModal.style.display = 'none';   //  force hide
if (helpIcon) helpIcon.style.display = 'none';

//  Render scoreboard per round
renderScoreboard();
});

// =======================
// HELPER: Compute contestant percentage
// =======================
function computePercentage(contestantTotals = {}, totalJudges = 1) {
  const sumAllJudges = Object.values(contestantTotals)
    .reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
  return totalJudges > 0 ? (sumAllJudges / (totalJudges * 100)) * 100 : 0;
}

const DEBUG = false;

function getNumJudgesForRound(roundNumber) {
  const roundMeta = Array.isArray(window.rounds)
    ? window.rounds.find(r => Number(r.roundNumber) === Number(roundNumber))
    : null;
  return roundMeta && Number(roundMeta.totalJudges) > 0
    ? Number(roundMeta.totalJudges)
    : 1;
}

/** Ensure percent element exists */
function ensurePercentElement(roundNumber, contestantId) {
  const section = document.querySelector(`.round-gallery-section[data-round="${roundNumber}"]`);
  if (!section) return null;

  const card = section.querySelector(`.scoreboard-card[data-contestant="${contestantId}"]`);
  if (!card) return null;

  let percent = card.querySelector('.percent');
  if (!percent) {
    percent = document.createElement('p');
    percent.className = 'percent';
    percent.textContent = '0.00%';
    card.appendChild(percent);
  }
  return percent;
}

/** Update ONE contestant */
function updateContestantPercent(roundNumber, contestantId) {
  const totalsKey = `judgeTotals_round_${roundNumber}`;
  let totalsData = {};

  try {
    totalsData = JSON.parse(localStorage.getItem(totalsKey) || '{}');
  } catch {}

  const contestantTotals = totalsData[String(contestantId)] || {};
  const numJudges = getNumJudgesForRound(roundNumber);
  const percentage = computePercentage(contestantTotals, numJudges);

  if (DEBUG) console.log('Update', roundNumber, contestantId, percentage);

  const el = ensurePercentElement(roundNumber, contestantId);
  if (el) el.textContent = percentage.toFixed(2) + '%';
}

/** Update ALL contestants of ONE round */
function refreshRound(roundNumber) {
  const section = document.querySelector(`.round-gallery-section[data-round="${roundNumber}"]`);
  if (!section) return;

  section.querySelectorAll('.scoreboard-card[data-contestant]')
    .forEach(card => {
      updateContestantPercent(roundNumber, card.dataset.contestant);
    });
}

/** Initial render */
function renderScoreboard() {
  const scoreboardPage = document.getElementById('scoreboard');
  if (!scoreboardPage || !Array.isArray(rounds)) return;

  scoreboardPage.innerHTML = '';

  rounds.forEach(round => {
    const roundNumber = Number(round.roundNumber);

    const section = document.createElement('div');
    section.className = 'round-gallery-section';
    section.dataset.round = roundNumber;

//  Add vertical spacing between rounds
    section.style.marginBottom = '3rem'; // 48px spacing

    const title = document.createElement('h3');
    title.textContent = `ROUND ${roundNumber} Scoreboard`;
    title.className = 'text-xl font-bold mb-4';

    const grid = document.createElement('div');
    grid.className = 'grid gap-6';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';

    const totalsKey = `judgeTotals_round_${roundNumber}`;
    let totalsData = {};

    try {
      totalsData = JSON.parse(localStorage.getItem(totalsKey) || '{}');
    } catch {}

    const numJudges = getNumJudgesForRound(roundNumber);

    for (let i = 1; i <= round.totalContestants; i++) {
      const contestantId = String(i);

      const card = document.createElement('div');
      card.className = 'scoreboard-card';
      card.dataset.round = roundNumber;
      card.dataset.contestant = contestantId;

      const img = document.createElement('img');
      img.src = 'Anonymousphoto.jpg';
      img.className = 'w-full rounded mb-2';

      const percent = document.createElement('p');
      percent.className = 'percent font-bold text-lg';

      const percentage = computePercentage(
        totalsData[contestantId] || {},
        numJudges
      );

      percent.textContent = percentage.toFixed(2) + '%';

      card.appendChild(img);
      card.appendChild(percent);
      grid.appendChild(card);
    }

    section.appendChild(title);
    section.appendChild(grid);
    scoreboardPage.appendChild(section);
  });
}

/* =========================
   REALTIME UPDATES (FIXED)
========================= */

// Cross-tab
window.addEventListener('storage', e => {
  if (!e.key) return;
  const m = e.key.match(/^judgeTotals_round_(\d+)$/);
  if (!m) return;
  refreshRound(Number(m[1]));
});

// BroadcastChannel
try {
  const bc = new BroadcastChannel('judge-totals');
  bc.onmessage = msg => {
    const data = msg.data || {};
    if (!data.roundNumber) return;
    refreshRound(data.roundNumber);
  };
} catch {}

// Same-tab custom event
window.addEventListener('judgeTotalsUpdate', e => {
  const { roundNumber } = e.detail || {};
  if (!roundNumber) return;
  refreshRound(roundNumber);
});

//  REQUIRED INITIAL RENDER
document.addEventListener('DOMContentLoaded', renderScoreboard);

// =======================
// ADMIN DROPDOWN & LOGOUT (SYNCED FROM LOGIN)
// =======================

function updateAdminDropdown() {
  const username = localStorage.getItem("currentUser");
  const role = localStorage.getItem("currentRole");

  const usernameEl = document.getElementById("dropdownAdminUsername");
  const roleEl = document.getElementById("dropdownAdminRole");

  if (usernameEl) {
    usernameEl.textContent = username ? username : "Unknown";
  }

  if (roleEl) {
    roleEl.textContent = role ? role.toUpperCase() : "UNKNOWN";
  }
}

updateAdminDropdown();

// Toggle dropdown
adminUserIconContainer.addEventListener('click', (e) => {
  e.stopPropagation();
  adminDropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
  adminDropdown.classList.add('hidden');
});

// Logout
logoutBtn.addEventListener('click', () => {
  adminDropdown.classList.add('hidden');
  logoutModal.classList.remove('hidden');
});

confirmLogout.addEventListener('click', () => {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentRole");

  logoutModal.classList.add('hidden');
  alert('Logged out successfully!');
  window.location.href = "index.html";
});

cancelLogout.addEventListener('click', () => {
  logoutModal.classList.add('hidden');
});

// =======================
// OVERLAY HELPERS
// =======================
function showOverlay() {
  let overlay = document.createElement('div');
  overlay.id = 'pageOverlay';
  overlay.className = 'overlay';
  document.body.appendChild(overlay);
}

function hideOverlay() {
  const overlay = document.getElementById('pageOverlay');
  if (overlay) overlay.remove();
}

// =======================
// MANUAL ADD ROUND BUTTON
// =======================
manualAddRoundBtn.addEventListener('click', () => {
  addRoundModal.classList.remove('hidden');
  setTimeout(() => addRoundModal.classList.add('show'), 10);
});

  // =======================
  // ADD ROUND MODAL BUTTONS (updated)
  // =======================
  addRoundYes.addEventListener('click', () => {
    // Close modal
    addRoundModal.classList.remove('show');
    setTimeout(() => addRoundModal.classList.add('hidden'), 300);

    // Advance round and reset only ephemeral state for the new round
    currentRound.roundNumber++;
    tempImages = {};        // new uploads for this round
    savedImages = {};       // working saved images for this round

    // Rebuild main table body for the new round (keeps column structure)
    const mainTableBody = document.getElementById('tableBody');
    if (mainTableBody) mainTableBody.innerHTML = '';

    const criteriaCount = criteriaList.querySelectorAll('.criteria-title').length;
    const totalContestantsInput = document.getElementById('customContestantNumber');
    const totalContestants = parseInt(totalContestantsInput.value, 10) || 0;

    for (let i = 1; i <= totalContestants; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i}</td>`;
      for (let j = 0; j < criteriaCount; j++) {
        const td = document.createElement('td');
        td.textContent = '';
        td.style.textAlign = 'center';
        td.style.height = '1.4rem';
        tr.appendChild(td);
      }
      mainTableBody.appendChild(tr);
    }

    // Keep main table and admin controls hidden while preparing the new round
    const mainTableElement = document.getElementById('contestantTable');
    const mainCustomizeBtn = document.getElementById('customizeBtn');
    const eventNameDisplay = document.getElementById('eventNameDisplay');
    if (mainTableElement) mainTableElement.style.display = 'none';
    if (mainCustomizeBtn) mainCustomizeBtn.style.display = 'none';
    if (eventNameDisplay) eventNameDisplay.style.display = 'none';

    // Ensure process container layout is visible and ready
    processContainer.style.display = 'flex';
    processContainer.style.flexDirection = 'row';

    // Clear customize inputs for the new round
    const customEventEl = document.getElementById('customEventName');
    const customContestantEl = document.getElementById('customContestantNumber');
    const customJudgeEl = document.getElementById('customJudgeNumber');
    if (customEventEl) customEventEl.value = '';
    if (customContestantEl) customContestantEl.value = '';
    if (customJudgeEl) customJudgeEl.value = '';

    // Show process page and open the help/modal to review criteria
    showPage('processContainer');

    if (helpModal) {
      helpModal.classList.remove('hidden');
      setTimeout(() => helpModal.classList.add('show'), 10);
    }

    // Make Edit Criteria visible inside the help modal for quick edits
    allowEditVisible = true;
    const helpContent = document.querySelector('#helpModal .modal-content');
    if (helpContent && editBtn) {
      if (editBtn.parentElement !== helpContent) helpContent.appendChild(editBtn);
      editBtn.style.display = 'inline-flex';
      editBtn.classList.remove('hidden');
      editBtn.style.margin = '1rem auto';
      editBtn.style.justifyContent = 'center';

      helpContent.style.display = 'flex';
      helpContent.style.flexDirection = 'column';
      helpContent.style.alignItems = 'center';
    }

    alert(` Starting Round ${currentRound.roundNumber} — review criteria first, then click Edit Criteria to modify.`);
  });

  addRoundNo.addEventListener('click', () => {
    addRoundModal.classList.remove('show');
    addRoundModal.classList.add('hidden');

    isFirstRoundFinalized = true;
    alert(` Round ${currentRound.roundNumber} finalized. No additional rounds will be added.`);
    showPage('processContainer');
  });

  // =======================
  // INITIAL TABLE
  // =======================
  updateTable();
  adjustTableColumnWidths();


// ======================= 
// DEPLOY BUTTON (Round-Correct + Active Round Control)
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const deployBtn = document.getElementById('deployBtn');
  const exportBtn = document.getElementById('exportBtn'); // reference Export button
  if (!deployBtn) return;

  deployBtn.addEventListener('click', async () => {
    const updatedRounds = Array.isArray(rounds) ? rounds : [];
    if (updatedRounds.length === 0) {
      alert('ℹ No rounds to deploy.');
      return;
    }

    try {
      // 1️ SANITIZE ROUNDS
      for (const round of updatedRounds) {
        if (!round.criteria || round.roundNumber === currentRound.roundNumber) {
          const titles = Array.from(document.querySelectorAll('#criteriaList .criteria-title'));
          round.criteria = titles.map(titleEl => {
            const block = titleEl.closest('.criteria-block') || titleEl.parentElement;
            const items = Array.from(block.querySelectorAll('li')).map(li => li.textContent.trim());
            return { name: titleEl.textContent.trim(), maxPoints: '', items };
          });
        }

        // IMAGE SANITIZATION
        const sanitizedImages = {};
        const savedImages = round.savedImages || {};
        for (const [contestantId, imgData] of Object.entries(savedImages)) {
          try {
            if (imgData instanceof File || (typeof imgData === 'string' && !imgData.startsWith('http'))) {
              const url = await uploadImageToCloudinary(imgData);
              sanitizedImages[contestantId] = url;
            } else {
              sanitizedImages[contestantId] = imgData;
            }
          } catch (err) {
            console.error(` Image upload failed for contestant ${contestantId}`, err);
          }
        }
        round.savedImages = sanitizedImages;
      }

      // 2️ SAVE PROCESS HTML SNAPSHOT
      const processContainerEl = document.getElementById('processContainer');
      if (processContainerEl) {
        const cloned = processContainerEl.cloneNode(true);
        const currentUser = localStorage.getItem('currentUser') || '';
        const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');

        cloned.querySelectorAll('.judge-table-container').forEach((card, idx) => {
          const roundAttr = card.dataset.round;
          card.dataset.judge = String(idx + 1);

          const headerText = (card.querySelector('h3')?.textContent || '').trim();
          let headerJudgeName = '';
          const match = headerText.match(/Judge\s*\d+:\s*(.+)$/i);
          if (match) headerJudgeName = match[1].trim();

          let mappedJudgeName = '';
          if (roundAttr) {
            const rd = roundsData.find(r => String(r.roundNumber) === String(roundAttr));
            mappedJudgeName = (rd?.judges || [])[idx] || '';
          }

          const finalJudgeName = headerJudgeName || mappedJudgeName || currentUser;
          card.dataset.judgeName = finalJudgeName;
        });

        cloned.querySelectorAll('.help-icon').forEach(icon => {
          if (!icon.dataset.judge) icon.dataset.judge = currentUser;
        });

        localStorage.setItem('processHTML', cloned.innerHTML.trim());
      }

      //  DEPLOY META
      const highestRoundNumber = Math.max(...updatedRounds.map(r => Number(r.roundNumber) || 1));
      localStorage.setItem('roundsData', JSON.stringify(updatedRounds));
      localStorage.setItem('adminRunning', 'true');
      localStorage.setItem('activeRound', String(highestRoundNumber));
      localStorage.setItem('lastDeployedRoundNumber', String(highestRoundNumber));
      localStorage.setItem('lastDeployTime', Date.now().toString());

      alert(` Deployment complete! ACTIVE ROUND: ${highestRoundNumber}\nJudges will now submit to this round only.`);

      if (typeof renderMonitoringTables === 'function') {
        renderMonitoringTables();
      }

      //  Show Export button after successful deploy
      if (exportBtn) exportBtn.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      alert(` Deployment failed:\n${err.message}`);
    }
  });
});

// =======================
// EXPORT BUTTON LOGIC (ADMIN DASHBOARD PER ROUND)
// =======================
const exportModal = document.getElementById('exportModal');
const exportRoundSelect = document.getElementById('exportRoundSelect');
const exportFormatSelect = document.getElementById('exportFormatSelect');
const cancelExport = document.getElementById('cancelExport');
const confirmExport = document.getElementById('confirmExport');
const exportBtn = document.getElementById('exportBtn');

exportBtn?.addEventListener('click', () => {
  exportRoundSelect.innerHTML = '';
  const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');

  if (!roundsData.length) {
    alert(" No rounds available to export.");
    return;
  }

  roundsData.forEach(round => {
    const opt = document.createElement('option');
    opt.value = round.roundNumber;
    opt.textContent = `Round ${round.roundNumber}`;
    exportRoundSelect.appendChild(opt);
  });

  exportModal.classList.remove('hidden');
});

cancelExport?.addEventListener('click', () => {
  exportModal.classList.add('hidden');
});

confirmExport?.addEventListener('click', async () => {
  const roundNumber = exportRoundSelect.value;
  const format = exportFormatSelect.value;

  if (!roundNumber) {
    alert(" Please select a round to export.");
    return;
  }

  const judgeCards = Array.from(document.querySelectorAll(`.judge-table-container[data-round="${roundNumber}"]`));
  if (!judgeCards.length) {
    alert(` Judge tables not found for Round ${roundNumber}.`);
    return;
  }

  const clonedContainer = document.createElement('div');
  clonedContainer.style.position = 'absolute';
  clonedContainer.style.left = '-9999px';
  clonedContainer.style.top = '0';
  clonedContainer.style.display = 'block';
  clonedContainer.style.width = '70%';
  clonedContainer.style.boxSizing = 'border-box';

  const header = document.createElement('h2');
  header.textContent = `Round ${roundNumber} — Judge Tables`;
  header.style.textAlign = 'center';
  header.style.marginBottom = '1rem';
  header.style.fontFamily = 'Arial, sans-serif';
  clonedContainer.appendChild(header);

  const totalsKey = `judgeTotals_round_${roundNumber}`;
  let totalsData = {};
  try {
    totalsData = JSON.parse(localStorage.getItem(totalsKey) || '{}');
  } catch {}

  // Track seen judges to avoid exporting the same judge twice (prevents duplicates)
  const seenJudges = new Set();

  judgeCards.forEach(card => {
    // Determine a stable judge identifier
    const judgeId = (card.dataset.judge || card.dataset.judgeName || card.querySelector('.judge-name')?.textContent || '').toString().trim().toLowerCase();
    if (judgeId) {
      if (seenJudges.has(judgeId)) return; // skip duplicate judge cards
      seenJudges.add(judgeId);
    }

    // Find the first table that actually contains score content
    const tables = Array.from(card.querySelectorAll('table'));
    const validTable = tables.find(tbl =>
      Array.from(tbl.querySelectorAll('td')).some(td => td.textContent.trim() !== '')
    );

    if (!validTable) return; // skip if no filled table found

    // Build a fresh wrapper (do not clone the whole card to avoid bringing empty/duplicate tables)
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '2rem';
    wrapper.style.background = '#fff';
    wrapper.style.borderRadius = '0.75rem';
    wrapper.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    wrapper.style.padding = '1rem';

    // Optional judge header
    const judgeName = card.dataset.judgeName || card.querySelector('.judge-name')?.textContent || card.dataset.judge || '';
    if (judgeName) {
      const judgeHeader = document.createElement('h3');
      judgeHeader.textContent = `Judge: ${judgeName.trim()}`;
      judgeHeader.style.textAlign = 'center';
      judgeHeader.style.marginBottom = '0.5rem';
      judgeHeader.style.fontFamily = 'Arial, sans-serif';
      wrapper.appendChild(judgeHeader);
    }

    // Clone only the valid table (first filled one)
    const clonedTable = validTable.cloneNode(true);
    clonedTable.style.borderCollapse = 'collapse';
    clonedTable.style.width = '60%';
    clonedTable.style.minWidth = '670px';

    // Normalize cells styling
    clonedTable.querySelectorAll('th, td').forEach(cell => {
      cell.style.border = '1px solid #000';
      cell.style.padding = '0.35rem';
      cell.style.fontWeight = '600';
      cell.style.textAlign = 'center';
    });

    wrapper.appendChild(clonedTable);
    clonedContainer.appendChild(wrapper);
  });

  // If nothing valid was appended, inform user and abort
  if (!clonedContainer.querySelector('table')) {
    alert(' No filled judge tables found to export.');
    return;
  }

  document.body.appendChild(clonedContainer);
  const fileName = `Round${roundNumber}_JudgeTables.${format}`;

  // Helper to dynamically load a script (used for html-docx-js fallback)
  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load script: ' + src));
    document.head.appendChild(s);
  });

  try {
    if (format === 'pdf') {
      const { jsPDF } = window.jspdf;
      const canvas = await html2canvas(clonedContainer, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);

      pdf.addImage(imgData, 'PNG', 10, 10, imgProps.width * ratio, imgProps.height * ratio);
      pdf.save(fileName);
    }
    else if (format === 'docx') {
      // Build HTML content with inline styles for Word compatibility
      const content = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; }
              h2, h3 { text-align: center; margin-bottom: 10px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #000; padding: 6px; text-align: center; }
            </style>
          </head>
          <body>${clonedContainer.innerHTML}</body>
        </html>
      `;

      // Try to use html-docx-js if available; otherwise attempt to load it from CDN
      if (!(window.htmlDocx && typeof window.htmlDocx.asBlob === 'function')) {
        try {
          await loadScript('https://unpkg.com/html-docx-js/dist/html-docx.js');
        } catch (loadErr) {
          console.warn('Could not load html-docx-js from CDN, falling back to HTML blob:', loadErr);
        }
      }

      if (window.htmlDocx && typeof window.htmlDocx.asBlob === 'function') {
        try {
          const converted = window.htmlDocx.asBlob(content);
          const url = URL.createObjectURL(converted);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('DOCX conversion (htmlDocx) failed:', e);
          alert('❌ DOCX conversion failed.');
        }
      } else {
        // Fallback: create a Word-compatible HTML blob (opens in Word/LibreOffice)
        try {
          const blob = new Blob([content], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('DOCX fallback failed:', e);
          alert(' DOCX export failed.');
        }
      }
    }
    else {
      alert(" Unsupported format.");
    }
  } catch (err) {
    console.error(" Export failed:", err);
    alert(` Export failed: ${err.message}`);
  } finally {
    // Ensure cleanup even on error
    if (clonedContainer.parentNode) {
      document.body.removeChild(clonedContainer);
    }
    exportModal.classList.add('hidden');
  }
});

// =======================
// CRITERIA MODAL TOGGLE
// =======================
const criteriaBtn = document.getElementById("criteriaBtn");
const criteriaModal = document.getElementById("criteriaModal");
const closeCriteria = document.getElementById("closeCriteria");

criteriaBtn?.addEventListener("click", () => criteriaModal.classList.add("show"));
closeCriteria?.addEventListener("click", () => criteriaModal.classList.remove("show"));
criteriaModal?.addEventListener("click", (e) => { if (e.target === criteriaModal) criteriaModal.classList.remove("show"); });

// =======================
// IMAGE COMPRESSION HELPER
// =======================
async function compressImage(base64Str, maxWidth = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality
    };
  });
}

// Example usage inside file input change
reader.onload = async ev => {
  const rawImageData = ev.target.result;
  const compressedData = await compressImage(rawImageData);

  const alreadyUsed = Object.values(tempImages).includes(compressedData);
  if (alreadyUsed) {
    alert("❌ Photo already used.");
    return;
  }

  tempImages[targetNum] = compressedData;
  alert(`✅ Photo assigned to #${targetNum}.`);
};

// =======================
// ADMIN MONITORING RENDERER (READ-ONLY, SAME VISUALS)
// =======================
function renderMonitoringTables() {
  const container = document.getElementById('monitorContainer');
  if (!container) return;

  const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
  const adminRunning = localStorage.getItem('adminRunning');
  const lastDeployTime = localStorage.getItem('lastDeployTime');

  // Empty state
  if (adminRunning !== 'true' || !lastDeployTime || roundsData.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center mt-10 text-gray-500">
        <p class="text-lg font-semibold mb-2">No deployed rounds yet</p>
        <p class="text-sm">Please deploy rounds to start monitoring</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  // Helper: sanitize judge name to a stable key
const sanitizeJudgeName = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

roundsData.forEach(round => {
  const roundNumber = Number(round.roundNumber);
  const section = document.createElement('div');
  section.className = 'round-gallery-section mb-6';
  section.innerHTML = `
    <h2 class="text-xl font-bold text-indigo-600 mb-4 text-center">
      ROUND ${roundNumber} — ${round.eventName || 'Event'}
    </h2>
  `;

  (round.judges || []).forEach((judgeName, jIndex) => {
    const card = document.createElement('div');
    card.className = 'judge-table-container bg-white rounded-lg shadow p-4 mb-4';
    card.dataset.judge = String(jIndex + 1);
    card.dataset.judgeName = judgeName;
    card.dataset.round = round.roundNumber;
    
    const header = document.createElement('h3');
    header.className = 'text-lg font-semibold mb-2 text-center';
    header.textContent = `Judge ${jIndex + 1}: ${judgeName}`;
    card.appendChild(header);

    const table = document.createElement('table');
    table.className = 'table-auto w-full text-center border';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    headerRow.innerHTML = `<th>Contestant</th>` +
      (round.criteria || []).map(c => `<th>${c.name}</th>`).join('');
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    // Round-correct totals
    const totalsKey = `judgeTotals_round_${roundNumber}`;
    let totalsData = {};
    try { totalsData = JSON.parse(localStorage.getItem(totalsKey) || '{}'); } catch {}

    //  Unified read: judgeName key first, fallback to tableIndex keys
    const judgeKeyName = sanitizeJudgeName(judgeName);
    const scoresKeyByName = `scores_round_${roundNumber}_judge_${judgeKeyName}`;

    let savedScores = {};
    try { savedScores = JSON.parse(localStorage.getItem(scoresKeyByName) || '{}'); } catch {}

    if (!Object.keys(savedScores).length) {
      const scoresKeyByIndex0 = `scores_round_${roundNumber}_table_${jIndex}`;
      const scoresKeyByIndex1 = `scores_round_${roundNumber}_table_${jIndex + 1}`;
      try { savedScores = JSON.parse(localStorage.getItem(scoresKeyByIndex0) || '{}'); } catch {}
      if (!Object.keys(savedScores).length) {
        try { savedScores = JSON.parse(localStorage.getItem(scoresKeyByIndex1) || '{}'); } catch {}
      }
    }
 
      // Candidate judge keys (for totals)
      const judgeKeyCandidates = [
        `judge_${jIndex}`,            // 0-based
        `judge_${jIndex + 1}`,        // 1-based
        judgeKeyName,                 // by name
        `table_${jIndex}`             // table index
      ];

      for (let i = 1; i <= round.totalContestants; i++) {
        const tr = document.createElement('tr');

        const tdIndex = document.createElement('td');
        tdIndex.textContent = i;
        tr.appendChild(tdIndex);

        // Criteria cells — support multiple savedScores shapes
        (round.criteria || []).forEach((_, ci) => {
          const td = document.createElement('td');
          const span = document.createElement('span');
          span.className = 'score-input';

          const rowData =
            savedScores[i - 1] ??        // array-style, 0-based
            savedScores[String(i)] ??    // object-style, "1"
            savedScores[i] ??            // object-style, 1
            null;

          let scoreValue;
          if (Array.isArray(rowData)) {
            scoreValue = rowData[ci];
          } else if (rowData && typeof rowData === 'object') {
            const criteriaName = (round.criteria || [])[ci]?.name;
            scoreValue =
              rowData[ci] ??
              (criteriaName && rowData[criteriaName]) ??
              (Array.isArray(rowData.scores) ? rowData.scores[ci] : undefined);
          } else {
            scoreValue = undefined;
          }

          span.textContent =
            scoreValue !== undefined && scoreValue !== null
              ? String(scoreValue)
              : '';

          td.appendChild(span);
          tr.appendChild(td);
        });

        // Total display — try multiple judge keys to match judge-side storage
        const totalSpan = document.createElement('span');
        totalSpan.className = 'score-total';

        const contestantTotals = totalsData[String(i)] || {};
        let sum = 0;
        for (const key of judgeKeyCandidates) {
          if (contestantTotals[key] !== undefined) {
            sum = Number(contestantTotals[key]) || 0;
            break;
          }
        }

        const capped = Math.min(sum, 100);
        totalSpan.textContent = `= ${capped}pts`;
        tr.appendChild(totalSpan);

        tbody.appendChild(tr);
      }

      table.appendChild(tbody);
      card.appendChild(table);
      section.appendChild(card);
    });

    container.appendChild(section);
  });
}

// =======================
// REAL-TIME UPDATES FOR ADMIN MONITORING (multi-round aware)
// =======================
window.addEventListener('storage', e => {
  if (!e.key) return;

  const match = e.key.match(/^judgeTotals_round_(\d+)$/);
  if (match) {
    const roundNumber = Number(match[1]);
    refreshRound(roundNumber);        // refresh tamang round
    return;
  }

  if (e.key === 'roundsData' || e.key === 'lastDeployTime') {
    renderMonitoringTables();         // rebuild lahat ng rounds
  }
});

try {
  const bc = new BroadcastChannel('judge-totals');
  bc.onmessage = msg => {
    const { roundNumber } = msg.data || {};
    if (roundNumber) {
      refreshRound(Number(roundNumber));   // refresh tamang round
    }
    renderMonitoringTables();              // rebuild monitoring view
  };
} catch {}

window.addEventListener('judgeTotalsUpdate', e => {
  const { roundNumber } = e.detail || {};
  if (roundNumber) {
    refreshRound(Number(roundNumber));     // refresh tamang round
  }
  renderMonitoringTables();
});

document.addEventListener('DOMContentLoaded', () => {
  renderMonitoringTables();
});
