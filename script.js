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

// Remove button for criteria
const removeCriteriaBtn = document.createElement("button");
removeCriteriaBtn.id = "removeCriteriaBtn";
removeCriteriaBtn.textContent = "Remove Criteria";
removeCriteriaBtn.className = "px-6 py-2 bg-red-500 text-white rounded-xl shadow hover:bg-red-600 transition ml-auto interactive-btn";
removeCriteriaBtn.style.display = "none";

// =======================
// STATE (added rounds[] for multi-round support)
// =======================
pages.forEach(p => p.classList.add('hidden'));
document.getElementById('dashboard').classList.remove('hidden');
processForm.style.display = 'none';
helpIcon.style.display = 'none';
addCriteriaBtn.style.display = 'none';
if(processImageGallery) processImageGallery.style.display = 'none';
processContainer.classList.remove('active');

let tempImages = {};              // Temporary images before saving
let savedImages = {};             // Saved contestant images
let rounds = [];                  // Store finalized rounds
window.totalJudges = 0;          // no default, set by admin
let judgeNames = [];              // Store judge names
let currentRound = { 
    roundNumber: 1, 
    savedImages: {}, 
    eventName: '', 
    totalContestants: 0, 
    criteriaCount: 0, 
    judges: [] 
};
let isFirstRoundFinalized = false; // Flag to preserve first round


// =======================
// SPA NAVIGATION
// =======================
function showPage(targetId) {
    pages.forEach(p => p.classList.add('hidden'));
    processForm.style.display = 'none';
    helpIcon.style.display = 'none';
    if(processImageGallery) processImageGallery.style.display = 'none';

    const targetPage = document.getElementById(targetId);
    if(targetPage) targetPage.classList.remove('hidden');

    if(targetId === 'processContainer') {
        processForm.style.display = 'block';
        helpIcon.style.display = 'flex';
        if(Object.keys(savedImages).length > 0) processImageGallery.style.display = 'grid';
    }
}
navLinks.forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    showPage(link.getAttribute('href').replace('#',''));
}));
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
    for(let row of tableBody.children){
        while(row.children.length > criteriaCount+1) row.removeChild(row.lastChild);
        for(let j=row.children.length-1; j<criteriaCount; j++){
            const td = document.createElement('td');
            td.textContent = '';
            td.style.height = '1.6rem';
            td.style.textAlign = 'center';
            row.appendChild(td);
        }
    }
    adjustTableColumnWidths();
}

function adjustTableColumnWidths(){
    const table = document.getElementById('contestantTable');
    if(!table) return;
    table.style.tableLayout='auto';
    requestAnimationFrame(()=>{ table.style.width='100%'; });
}
window.addEventListener('resize', adjustTableColumnWidths);

// =======================
// TEXTAREA AUTO-RESIZE
// =======================
function setupTextareaResize(textarea){
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
if(editBtn){
    editBtn.addEventListener('click', openEditCriteria);

    function openEditCriteria(){
        criteriaList.classList.add("hidden");
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

    function addCriteriaPair(title="", sublist=""){
        const pairDiv = document.createElement('div');
        pairDiv.className='criteria-pair';
        const titleTA = document.createElement('textarea');
        titleTA.placeholder="Main Criteria Title"; titleTA.dataset.type='title'; titleTA.value=title; setupTextareaResize(titleTA);
        const subTA = document.createElement('textarea');
        subTA.placeholder="Sublist (one per line)"; subTA.dataset.type='sublist'; subTA.value=sublist; setupTextareaResize(subTA);
        pairDiv.appendChild(titleTA); pairDiv.appendChild(subTA);
        const container = document.getElementById('criteriaButtons');
        criteriaEditForm.insertBefore(pairDiv, container);
        criteriaEditForm.scrollTop=criteriaEditForm.scrollHeight;
    }

    addCriteriaBtn.onclick=()=>addCriteriaPair();
    removeCriteriaBtn.onclick=()=>{ const pairs=criteriaEditForm.querySelectorAll(".criteria-pair"); if(pairs.length>0)pairs[pairs.length-1].remove(); };
    saveBtn.onclick=saveCriteria;
    cancelBtn.onclick=closeEditCriteria;

    function saveCriteria(){
        const pairs = criteriaEditForm.querySelectorAll(".criteria-pair");
        criteriaList.innerHTML='';
        pairs.forEach(pair=>{
            const title=pair.querySelector("textarea[data-type='title']").value.trim()||"New Criteria";
            const subText=pair.querySelector("textarea[data-type='sublist']").value;
            const p=document.createElement("p"); p.classList.add("criteria-title"); p.textContent=title;
            const ul=document.createElement("ul"); ul.classList.add("criteria-sublist");
            subText.split(/\n/).forEach(line=>{ if(line.trim()!==""){ const li=document.createElement("li"); li.textContent=line.trim(); ul.appendChild(li); } });
            criteriaList.appendChild(p); criteriaList.appendChild(ul);
        });
        updateTable(); closeEditCriteria();
        saveMessage.classList.remove("opacity-0");
        setTimeout(()=>saveMessage.classList.add("opacity-0"),2000);
    }

    function closeEditCriteria(){
        criteriaEditForm.innerHTML='';
        criteriaEditForm.classList.add("hidden");
        criteriaActions.classList.add("hidden");
        addCriteriaBtn.style.display='none';
        removeCriteriaBtn.style.display='none';
        criteriaList.classList.remove("hidden");
        editBtn.classList.remove("hidden");
    }
}

// =======================
// HELP MODAL
// =======================
helpIcon.addEventListener('click', ()=>helpModal.classList.add('show'));
closeHelp.addEventListener('click', ()=>helpModal.classList.remove('show'));

// =======================
// CUSTOMIZE MODAL & IMAGE LOGIC
// =======================
customizeBtn.addEventListener('click', ()=>{
    customizeModal.classList.add('show'); 
    customizeModal.classList.remove('hidden');

    // Reset event name
    document.getElementById('customEventName').value='';

    // Set contestant number based on existing table or saved images
    const currentTableCount = tableBody.children.length;
    const savedCount = Object.keys(savedImages).length;
    document.getElementById('customContestantNumber').value = currentTableCount || savedCount || '';

    // Only fill judge number if already set
    document.getElementById('customJudgeNumber').value = window.totalJudges > 0 ? window.totalJudges : '';

    // Clone existing images
    tempImages = Object.assign({}, savedImages);
});

function closeCustomizeModal() { 
    customizeModal.classList.remove('show'); 
    setTimeout(() => customizeModal.classList.add('hidden'), 150); 
}

[closeCustomize, cancelCustomize].forEach(btn => btn.addEventListener('click', closeCustomizeModal));

saveCustomize.addEventListener('click', ()=>{
    const eventName = document.getElementById("customEventName").value.trim();
    const contestantNum = parseInt(document.getElementById("customContestantNumber").value.trim());
    const judgeNum = parseInt(document.getElementById("customJudgeNumber").value.trim());
    let missing = [];
    if(!eventName) missing.push("Event Name");
    if(!contestantNum||contestantNum<=0) missing.push("Number of Contestants");
    if(!judgeNum||judgeNum<=0) missing.push("Number of Judges");
    if(missing.length>0){ alert(`⚠️ Please fill: ${missing.join(", ")}`); return; }

    const totalImages = Object.keys(tempImages).length;
    if(totalImages !== contestantNum){ alert(`⚠️ Assign exactly ${contestantNum} images. Currently: ${totalImages}`); return; }

    // Only now set totalJudges
    window.totalJudges = judgeNum;

    closeCustomizeModal(); 
    openFinalizationModal();
});

// =======================
// INSERT PHOTO LOGIC 
// =======================
insertPhotoBtn.addEventListener('click', ()=>{
    const totalContestants = parseInt(document.getElementById('customContestantNumber').value);
    if(isNaN(totalContestants) || totalContestants <= 0){ 
        alert("Enter number of contestants first."); 
        return; 
    }

    let nextNum = 1; 
    while(nextNum <= totalContestants && tempImages[nextNum]) nextNum++;
    if(nextNum > totalContestants){ 
        alert("All contestants already have images."); 
        return; 
    }

    const targetStr = prompt(`Assign image to contestant number (1-${totalContestants}):`, nextNum);
    if(targetStr === null) return;

    const targetNum = parseInt(targetStr);
    if(isNaN(targetNum) || targetNum < 1 || targetNum > totalContestants){ 
        alert(`Invalid number.`); 
        return; 
    }

    const fileInput = document.createElement('input'); 
    fileInput.type = 'file'; 
    fileInput.accept = 'image/*'; 
    fileInput.click();

    fileInput.addEventListener('change', e=>{
        const file = e.target.files[0]; 
        if(!file) return;
        const reader = new FileReader();
        reader.onload = e => { 
            tempImages[targetNum] = e.target.result; 
            alert(`Photo assigned to Contestant #${targetNum}. Click 'Save' to confirm.`); 
        };
        reader.readAsDataURL(file);
    });
});

// =======================
// HELPER: Clone table with styles
// =======================
function cloneTableWithStyle(sourceTable) {
    const clone = sourceTable.cloneNode(true);
    clone.id = ''; // remove duplicate ID

    // Copy column widths from source headers
    const sourceHeaders = sourceTable.querySelectorAll('th');
    const cloneHeaders = clone.querySelectorAll('th');

    sourceHeaders.forEach((th, idx) => {
        if (cloneHeaders[idx]) {
            const computed = getComputedStyle(th);
            cloneHeaders[idx].style.width = computed.width;
            cloneHeaders[idx].style.minWidth = computed.minWidth;
        }
    });

    // Copy table layout & width
    const computedTable = getComputedStyle(sourceTable);
    clone.style.tableLayout = computedTable.tableLayout;
    clone.style.width = computedTable.width;

    return clone;
}

// =======================
// OPEN FINALIZATION MODAL
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

// =======================
// CLOSE FINALIZATION MODAL
// =======================
function closeFinalizationModal() {
    finalizationModal.classList.remove('show');
    setTimeout(() => finalizationModal.classList.add('hidden'), 300);
}

// =======================
// FINALIZATION MODAL BUTTONS
// =======================

// X button: close only
closeFinalization.addEventListener('click', () => {
    closeFinalizationModal();
});

// Back button: close Finalization, reopen Customize
backFinalize.addEventListener('click', () => {
    closeFinalizationModal();
    setTimeout(() => {
        customizeModal.classList.remove('hidden');
        setTimeout(() => customizeModal.classList.add('show'), 10);
    }, 350);
});

    // =======================
    // FINALIZE TABULATION
    // =======================
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
            alert('⚠️ Please fill in all judge names before finalizing.');
            return;
        }

        // Store judge names
        judgeNames = Array.from(judgeInputs).map(input => input.value.trim());
        window.totalJudges = judgeNames.length;

        const eventNameInput = document.getElementById('customEventName');
        const contestantNumberInput = document.getElementById('customContestantNumber');
        const totalContestants = parseInt(contestantNumberInput.value);
        const criteriaCount = criteriaList.querySelectorAll('.criteria-title').length;

        document.getElementById('eventNameDisplay').textContent = eventNameInput.value;

        // === Judges tables container ===
    let judgesContainer = document.getElementById('judgesTablesContainer');
    if (!judgesContainer) {
        judgesContainer = document.createElement('div');
        judgesContainer.id = 'judgesTablesContainer';
        judgesContainer.className = 'w-full flex flex-col gap-6 mt-4';
        processForm.appendChild(judgesContainer);
    }
    

    const mainTable = document.getElementById('contestantTable'); // Judge 1 reference

    judgeNames.forEach((judge, index) => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-lg shadow p-4 judge-table-container";
        card.dataset.judge = index + 1;

        // === Event Name  ===
        const eventHeader = document.createElement("h2");
        eventHeader.textContent = document.getElementById("customEventName").value;
        eventHeader.style.fontSize = "1.3rem";
        eventHeader.style.fontWeight = "700";
        eventHeader.style.color = "#000";
        eventHeader.style.marginBottom = "0.5rem";
        eventHeader.style.textAlign = "center";
        card.appendChild(eventHeader);

    
        // === Create identical table for each judge ===
        const baseTable = document.getElementById('contestantTable');
        const newTable = baseTable.cloneNode(true); // deep clone (includes styles)

        // Reapply essential table classes for consistent visuals
        newTable.className = baseTable.className;
        newTable.style.width = baseTable.style.width;
        newTable.style.borderCollapse = baseTable.style.borderCollapse;
        newTable.style.border = baseTable.style.border;
        newTable.style.textAlign = baseTable.style.textAlign;

        // === Reset tbody rows ===
        const tbody = newTable.querySelector('tbody');
        tbody.innerHTML = '';

        for (let i = 1; i <= totalContestants; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${i}</td>`;
            for (let j = 0; j < criteriaCount; j++) {
                const td = document.createElement('td');
                td.textContent = '';
                td.style.minWidth = '80px';
                td.style.height = '1.4rem';
                td.style.textAlign = 'center';
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        card.appendChild(newTable);

    // === APPROVED AND VERIFIED BY footer ===
    const judgeFooter = document.createElement("div");
    judgeFooter.style.marginTop = "10px";
    judgeFooter.style.position = "relative";
    judgeFooter.style.width = "100%";

    // Line 1: Judge name
    const judgeNameLine = document.createElement("p");
    judgeNameLine.textContent = `APPROVED AND VERIFIED BY: ${judge}`;
    judgeNameLine.style.fontWeight = "600";
    judgeNameLine.style.color = "#4f46e5"; // indigo
    judgeNameLine.style.margin = "0";

    // Line 2: Judge number
    const judgeNumberLine = document.createElement("p");
    judgeNumberLine.textContent = `JUDGE NO. ${index + 1}`;
    judgeNumberLine.style.fontWeight = "600";
    judgeNumberLine.style.color = "#4f46e5"; // indigo
    judgeNumberLine.style.margin = "0";

    // Align number right under the "BY:" part of the first line
    // Calculate offset dynamically
    judgeNumberLine.style.paddingLeft = `${"APPROVED AND VERIFIED BY: ".length}ch`;

    judgeFooter.appendChild(judgeNameLine);
    judgeFooter.appendChild(judgeNumberLine);

    card.appendChild(judgeFooter);

        // === Customize button ===
        const customizeBtn = document.createElement('button');
        customizeBtn.className = 'customize-btn mt-2 bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700';
        customizeBtn.textContent = 'Customize Tabulation';
        customizeBtn.addEventListener('click', () => {
            alert(`Customize tabulation for ${judge}`);
        });
        card.appendChild(customizeBtn);

        judgesContainer.appendChild(card);

        // HIDE customize buttons in judge tables after finalization
    document.querySelectorAll('.judge-table-container .customize-btn')
        .forEach(btn => btn.style.display = 'none');

    });

        // === Save images ===
        savedImages = {};
        Object.keys(tempImages).forEach(k => {
            const num = parseInt(k);
            if (!isNaN(num) && num >= 1 && num <= totalContestants) savedImages[num] = tempImages[k];
        });

        // === Render image gallery ===
        processImageGallery.innerHTML = '';
        Object.keys(savedImages)
            .map(k => parseInt(k))
            .sort((a, b) => a - b)
            .forEach(num => {
                const src = savedImages[num];
                if (!src) return;
                const card = document.createElement('div');
                card.className = 'contestant-card';
                const img = document.createElement('img');
                img.src = src;
                img.alt = `Contestant ${num}`;
                const label = document.createElement('p');
                label.className = 'contestant-label';
                label.textContent = `Contestant #${num}`;
                card.appendChild(img);
                card.appendChild(label);
                processImageGallery.appendChild(card);
            });
        processImageGallery.style.display = Object.keys(savedImages).length > 0 ? 'grid' : 'none';

        processContainer.classList.add('active');
        if (helpIcon) helpIcon.style.display = 'flex';
        contestantNumberInput.value = '';
        document.getElementById('customJudgeNumber').value = '';

        // === Update main table ===
        const mainTableBody = document.getElementById('tableBody');
        mainTableBody.innerHTML = '';
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

            updateTable();
        adjustTableColumnWidths();

        // === HIDE MAIN TABLE AFTER FINALIZE ===
    const eventName = document.getElementById('eventNameDisplay');
    const mainTableElement = document.getElementById('contestantTable'); 
    const mainCustomizeBtn = document.getElementById('customizeBtn');

    if (eventName) eventName.style.display = 'none';
    if (mainTableElement) mainTableElement.style.display = 'none';
    if (mainCustomizeBtn) mainCustomizeBtn.style.display = 'none';

    // Hide edit criteria button (inside Help Modal after finalizing)
    if (editBtn) editBtn.style.display = 'none';

        closeFinalizationModal();
        alert(`✅ Tabulation finalized successfully! Total Judges: ${window.totalJudges}`);

// ============ CREATE NEW ROUND RECORD ============

// Create round wrapper
const roundWrapper = document.createElement('div');
roundWrapper.className = 'rounded-xl shadow-lg p-4 bg-gray-50';
roundWrapper.style.border = "2px solid #6366f1";

// Round Title
const roundTitle = document.createElement('h1');
roundTitle.textContent = `ROUND ${currentRound.roundNumber}`;
roundTitle.className = "text-2xl font-bold text-indigo-600 mb-4 text-center";

roundWrapper.appendChild(roundTitle);

// Container for judges tables of THIS round
const thisRoundJudgesContainer = document.createElement('div');
thisRoundJudgesContainer.className = "flex flex-col gap-6";
roundWrapper.appendChild(thisRoundJudgesContainer);  
});

// Manual Add Round button
const manualAddRoundBtn = document.getElementById('manualAddRoundBtn');
manualAddRoundBtn.addEventListener('click', () => {
    addRoundModal.classList.remove('hidden');
    setTimeout(() => addRoundModal.classList.add('show'), 10);
});

// =======================
// ADD ROUND MODAL BUTTONS
// =======================
const addRoundYes = document.getElementById('addRoundYes');
const addRoundNo = document.getElementById('addRoundNo');
const addRoundModal = document.getElementById('addRoundModal');

addRoundYes.addEventListener('click', () => {
    // Close the modal
    addRoundModal.classList.remove('show');
    setTimeout(() => addRoundModal.classList.add('hidden'), 300);

    // Increment round number
    currentRound.roundNumber++;

    // Clear savedImages and tempImages for new round
    tempImages = {};
    savedImages = {};

    // Reset main table body
    const mainTableBody = document.getElementById('tableBody');
    mainTableBody.innerHTML = '';

    const criteriaCount = criteriaList.querySelectorAll('.criteria-title').length;

    // Reset main table rows (keep number of contestants if needed)
    const totalContestantsInput = document.getElementById('customContestantNumber');
    const totalContestants = parseInt(totalContestantsInput.value) || 0;
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

    // Show main table and Customize button
    const mainTableElement = document.getElementById('contestantTable');
    const mainCustomizeBtn = document.getElementById('customizeBtn');
    const eventNameDisplay = document.getElementById('eventNameDisplay');
    
    if(mainTableElement) mainTableElement.style.display = 'table';
    if(mainCustomizeBtn) mainCustomizeBtn.style.display = 'inline-block';
    if(eventNameDisplay) eventNameDisplay.style.display = 'block';

    // Instead of processContainer.classList.remove('active');
processContainer.style.display = 'flex'; // keep flex for stable layout
processContainer.style.flexDirection = 'row'; // side by side


    // ===== CLEAR INPUT FIELDS BEFORE OPENING CUSTOMIZE MODAL =====
    document.getElementById('customEventName').value = '';
    document.getElementById('customContestantNumber').value = '';
    document.getElementById('customJudgeNumber').value = '';

    // Automatically open Customize Tabulation modal
    customizeModal.classList.remove('hidden');
    setTimeout(() => customizeModal.classList.add('show'), 10);

    alert(`🆕 Starting Round ${currentRound.roundNumber}`);
});

// NO button handler — attach **outside** the Yes handler
addRoundNo.addEventListener('click', () => {
    addRoundModal.classList.remove('show');
    setTimeout(() => addRoundModal.classList.add('hidden'), 300);

    isFirstRoundFinalized = true;
    alert(`✅ Round ${currentRound.roundNumber} finalized. No additional rounds will be added.`);
});

// ================= SHOW ADD ROUND & DEPLOY AFTER FIRST FINALIZE =================
const addRoundBtn = document.getElementById('manualAddRoundBtn');
const deployBtn = document.getElementById('deployBtn');

function showProcessButtons() {
  const currentPage = document.getElementById('processContainer');
  if (currentPage) {
    addRoundBtn.style.display = 'inline-block';
    deployBtn.style.display = 'inline-block';
  }
}

const confirmFinalizeBtn = document.getElementById('confirmFinalize');
confirmFinalizeBtn.addEventListener('click', () => {
  // Logic after finalization
  showProcessButtons();
});

// =======================
// INITIAL TABLE
// =======================
updateTable();
adjustTableColumnWidths();

