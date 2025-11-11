
  //  All Data
  let participants = [];
  let scores = {};
  let totalScoresSubmitted = 0;
  let lastInvalidInput = null; // track last invalid input for modal

  //  Modal Functions 
  function showModal(message, inputElement = null) {
    document.getElementById("limitMessage").textContent = message;
    document.getElementById("limitModal").classList.remove("hidden");
    lastInvalidInput = inputElement;
  }

  function closeModal() {
    document.getElementById("limitModal").classList.add("hidden");
    if (lastInvalidInput) {
      lastInvalidInput.focus();
      lastInvalidInput = null;
    }
  }

  //  Duplicate Name Modal (Animated) 
  function showDuplicateNameModal() {
    const modal = document.getElementById("duplicateNameModal");
    modal.classList.remove("hidden");
    setTimeout(() => {
      modal.classList.remove("opacity-0");
      const inner = modal.querySelector("div");
      if (inner) inner.classList.remove("scale-95");
    }, 10);
  }

  function closeDuplicateNameModal() {
    const modal = document.getElementById("duplicateNameModal");
    modal.classList.add("opacity-0");
    const inner = modal.querySelector("div");
    if (inner) inner.classList.add("scale-95");
    setTimeout(() => modal.classList.add("hidden"), 300);
  }

  //  Add Participant 
  function addParticipant() {
    const input = document.getElementById("participantName");
    const raw = input.value || "";
    const name = raw.trim();
    if (!name) return showModal("Please enter a participant name.");

    const exists = participants.some(p => p.toLowerCase() === name.toLowerCase());
    if (exists) {
      showDuplicateNameModal();
      return;
    }

    participants.push(name);
    scores[name] = [];
    input.value = "";

    updateParticipantsUI();
    updateMetrics();
    updateScoreboardAnonymous();
  }

  //  Update Participant List & Select 
  function updateParticipantsUI() {
    const list = document.getElementById("participantsList");
    const select = document.getElementById("selectParticipant");

    list.innerHTML = "";
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select participant";
    placeholder.disabled = false;
    placeholder.selected = true;
    select.appendChild(placeholder);

    participants.forEach(p => {
      const li = document.createElement("li");
      li.textContent = p;
      list.appendChild(li);

      const option = document.createElement("option");
      option.value = p;
      option.textContent = p;
      if (scores[p] && scores[p].length > 0) {
        option.disabled = true;
        option.textContent += " Scored ✅";
      }
      select.appendChild(option);
    });

    updateDashboard();
  }

  //  Log Score
  function logScore(name, presence, personality, relevance, total) {
    const logs = document.getElementById("logsList");
    const li = document.createElement("li");
    li.textContent = `${name}: Presence=${presence}, Personality=${personality}, Relevance=${relevance} → Total=${total}`;
    logs.appendChild(li);
  }

  function addCriteriaScores() {
    const name = document.getElementById("selectParticipant").value;
    const presenceEl = document.getElementById("presenceScore");
    const personalityEl = document.getElementById("personalityScore");
    const relevanceEl = document.getElementById("relevanceScore");

    if (!name || !scores[name]) return showModal("Participant not found.");
    if (scores[name].length > 0) return showModal("This participant already has a score.");

    const presence = parseFloat(presenceEl.value);
    const personality = parseFloat(personalityEl.value);
    const relevance = parseFloat(relevanceEl.value);

    if ([presence, personality, relevance].some(isNaN)) {
      return showModal("Please enter valid numbers for all criteria.", presenceEl);
    }

    if (presence < 0 || presence > 40) return showModal("Beauty, Style & Stage Presence must be 0-40.", presenceEl);
    if (personality < 0 || personality > 40) return showModal("Intelligence, Communication & Personality must be 0-40.", personalityEl);
    if (relevance < 0 || relevance > 20) return showModal("Talent, Advocacy & Social Relevance must be 0-20.", relevanceEl);

    const total = presence + personality + relevance;
    if (total > 100) return showModal("Total score cannot exceed 100 points.", relevanceEl);

    // Add the score
    scores[name].push({ presence, personality, relevance });
  totalScoresSubmitted++;

    // Log the score
    logScore(name, presence.toFixed(2), personality.toFixed(2), relevance.toFixed(2), total.toFixed(2));

    // Clear inputs
    [presenceEl, personalityEl, relevanceEl].forEach(input => {
      input.value = "";
      input.classList.remove("border-red-500", "valid-score");
      const span = input.nextElementSibling;
      if (span && span.tagName === "SPAN") span.classList.add("hidden");
    });

    // Update UI
    updateDashboard();
    updateMetrics();
    updateScoreboardAnonymous();
    updateParticipantsUI();

    // Show success message with fade-in/out
    const messageEl = document.getElementById("submitMessage");
    if (messageEl.fadeTimeout) clearTimeout(messageEl.fadeTimeout);
    messageEl.classList.remove("opacity-0");  // fade in
    messageEl.fadeTimeout = setTimeout(() => messageEl.classList.add("opacity-0"), 3000);
  }

  // Dashboard helpers 
  function ordinalSuffix(rank) {
    const j = rank % 10, k = rank % 100;
    if (j === 1 && k !== 11) return rank + "st";
    if (j === 2 && k !== 12) return rank + "nd";
    if (j === 3 && k !== 13) return rank + "rd";
    return rank + "th";
  }

  function updateDashboard() {
    const tbody = document.querySelector("#scoreTable tbody");
    const winnerNameEl = document.getElementById("winnerName");
    const winnerScoreEl = document.getElementById("winnerScore");
    tbody.innerHTML = "";

    if (!participants.length) {
      winnerNameEl.textContent = "No participants yet";
      winnerScoreEl.textContent = "--";
      return;
    }

    const maxScores = { presence: 40, personality: 40, relevance: 20 };
    const maxTotal = Object.values(maxScores).reduce((a, b) => a + b, 0);

    const data = participants.map(name => {
      const arr = scores[name] || [];
      const avgPresence = arr.length ? arr.reduce((a,b)=>a + b.presence, 0) / arr.length : 0;
      const avgPersonality = arr.length ? arr.reduce((a,b)=>a + b.personality, 0) / arr.length : 0;
      const avgRelevance = arr.length ? arr.reduce((a,b)=>a + b.relevance, 0) / arr.length : 0;
      const avgTotal = avgPresence + avgPersonality + avgRelevance;
      return {
        name,
        avgPresence: parseFloat(avgPresence.toFixed(2)),
        avgPersonality: parseFloat(avgPersonality.toFixed(2)),
        avgRelevance: parseFloat(avgRelevance.toFixed(2)),
        avgTotal: parseFloat(avgTotal.toFixed(2)),
        percentage: parseFloat(((avgTotal / maxTotal) * 100).toFixed(2))
      };
    }).sort((a,b)=>b.percentage - a.percentage);

    let currentRank = 1, lastScore = null;
    data.forEach((row, idx) => {
      if (row.percentage !== lastScore) currentRank = idx + 1;
      lastScore = row.percentage;

      const tr = document.createElement("tr");
      let highlightClass = "";
      if (currentRank === 1) highlightClass = "bg-yellow-200 font-bold";
      else if (currentRank === 2) highlightClass = "bg-gray-200 font-bold";
      else if (currentRank === 3) highlightClass = "bg-orange-200 font-bold";
      tr.className = highlightClass;

      tr.innerHTML = `
        <td class="py-2 px-4">${row.name}</td>
        <td class="py-2 px-4">${row.avgPresence} / ${maxScores.presence}</td>
        <td class="py-2 px-4">${row.avgPersonality} / ${maxScores.personality}</td>
        <td class="py-2 px-4">${row.avgRelevance} / ${maxScores.relevance}</td>
        <td class="py-2 px-4 font-semibold">${ordinalSuffix(currentRank)} (${row.percentage}%)</td>
      `;
      tbody.appendChild(tr);
    });

    if (data.length && parseFloat(data[0].avgTotal) > 0) {
      winnerNameEl.textContent = `🏆 ${data[0].name}`;
      winnerScoreEl.textContent = `Highest Score: ${data[0].percentage}% (Avg: ${data[0].avgTotal} / ${maxTotal})`;
    } else {
      winnerNameEl.textContent = "No scores yet";
      winnerScoreEl.textContent = "--";
    }
  }

  // Metrics 
  function updateMetrics() {
    document.getElementById("metricParticipants").textContent = participants.length;
    document.getElementById("metricScores").textContent = totalScoresSubmitted;

    let totals = [];

    for (let participant in scores) {
      scores[participant].forEach(s => {
        totals.push(s.presence + s.personality + s.relevance);
      });
    }

    const metricHighest = document.getElementById("metricHighest");
    const metricLowest = document.getElementById("metricLowest");
    const metricAverage = document.getElementById("metricAverage");

    if (totals.length > 0) {
      const highest = Math.max(...totals);
      const lowest = Math.min(...totals);
      const average = totals.reduce((a, b) => a + b, 0) / totals.length;

      metricHighest.textContent = highest.toFixed(2);
      metricLowest.textContent = lowest.toFixed(2);
      metricAverage.textContent = average.toFixed(2);
    } else {
      // Always show numeric placeholders
      document.getElementById("metricParticipants").textContent = 0;
    document.getElementById("metricScores").textContent = 0;
    document.getElementById("metricHighest").textContent = "0.00";
    document.getElementById("metricLowest").textContent = "0.00";
    document.getElementById("metricAverage").textContent = "0.00";
  }}

  // Live Clock
  let liveClockInterval = null;
  function startLiveClock() {
    const el = document.getElementById("liveDateTime");
    if (!el || liveClockInterval) return;
    liveClockInterval = setInterval(()=> {
      el.textContent = new Date().toLocaleString(undefined,{
        weekday:"long", year:"numeric", month:"short", day:"numeric",
        hour:"numeric", minute:"2-digit", second:"2-digit", hour12:true
      });
    },1000);
  }

  //  Anonymous Scoreboard
  function updateScoreboardAnonymous() {
    const container = document.getElementById("scoreboardContainer");
    container.innerHTML = "";

    const dateEl = document.getElementById("liveDateTime");
    if (!participants.length) {
      dateEl.classList.add("hidden");
      container.innerHTML = '<p class="text-center text-gray-400 col-span-full py-12">No participants yet.</p>';
      return;
    }

    const scoreData = participants.map(name => {
      const arr = scores[name] || [];
      const avgTotal = arr.length 
        ? arr.reduce((a, b) => a + b.presence + b.personality + b.relevance, 0) / arr.length 
        : 0;
      return { name, percent: parseFloat(avgTotal.toFixed(2)) };
    }).sort((a, b) => b.percent - a.percent);

    if (scoreData.some(p=>p.percent>0)) {
      dateEl.classList.remove("hidden");
      startLiveClock();
    } else dateEl.classList.add("hidden");

    scoreData.forEach(p => {
      const card = document.createElement("div");
      card.className = "anon-card";
      card.innerHTML = `
        <img src="Anonymous photo.jpg" alt="Anonymous" class="anon-avatar-img" />
        <div class="anon-name" style="display:none;">${p.name}</div>
        <div class="anon-percent">${p.percent}%</div>
        <div class="scorebar-track mt-4">
          <div class="scorebar-fill" style="width:${p.percent}%;"></div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  //  Navigation
  function showSection(id) {
    // Hide all pages
    document.querySelectorAll(".page").forEach(p => {
      p.classList.add("hidden");
      p.style.display = "none";
    });

    // Show selected section
    const section = document.getElementById(id);
    if (section) {
      section.classList.remove("hidden");
      section.style.display = "block";
    }

    // Update data when switching pages
    if (id === "dashboard") updateDashboard?.();
    if (id === "metrics") updateMetrics?.();
    if (id === "scoreboard") updateScoreboardAnonymous?.();
  }


  // Enter Key for Participant 
  document.getElementById("participantName").addEventListener("keydown", e=>{
    if (e.key === "Enter") { e.preventDefault(); addParticipant(); }
  });

  // Validate Inputs (Red/Green) 
  function validateScoreInput(input) {
    const min = parseInt(input.min, 10) || 0;
    const max = parseInt(input.max, 10) || Infinity;
    const value = parseFloat(input.value);
    const errorSpan = input.nextElementSibling;

    input.classList.remove("border-red-500", "valid-score");
    if (errorSpan && errorSpan.tagName === "SPAN") errorSpan.classList.add("hidden");

    if (isNaN(value) || value < min || value > max) {
      input.classList.add("border-red-500");
      if (errorSpan && errorSpan.tagName === "SPAN") errorSpan.classList.remove("hidden");
    } else if (input.value !== "") {
      input.classList.add("valid-score");
    }
  }

  //  Limit Inputs to 2 Decimal Places
  document.querySelectorAll("#presenceScore, #personalityScore, #relevanceScore").forEach(input => {
    input.addEventListener("input", () => {
      const value = input.value;
      if (!/^\d*\.?\d{0,2}$/.test(value)) {
        input.value = value.slice(0, -1);
      }
    });

    input.addEventListener("blur", () => {
      if (input.value !== "") {
        input.value = parseFloat(input.value).toFixed(2);
      }
    });
  });

  //  Judging Criteria Modal Logic 
  const criteriaModal = document.getElementById("criteriaModal");
  const criteriaList = document.getElementById("criteriaList");
  const editCriteriaBtn = document.getElementById("editCriteriaBtn");
  const criteriaEditForm = document.getElementById("criteriaEditForm");
  const criteriaActions = document.getElementById("criteriaActions");
  const saveCriteriaBtn = document.getElementById("saveCriteriaBtn");
  const cancelCriteriaBtn = document.getElementById("cancelCriteriaBtn");
  const criteriaSaveMessage = document.getElementById("criteriaSaveMessage");

  // Default judging criteria
  let judgingCriteria = [
    {
      title: "Beauty, Style & Stage Presence (Max 40 points)",
      desc: [
        "Covers all aspects of physical appearance, charisma and poise.",
        "Facial beauty, confidence and charm. (girls)",
        "Physique, fitness and grooming. (boys)",
        "Elegance in evening gown & swimsuit.",
        "Overall stage presence & impact."
      ]
    },
    {
      title: "Intelligence, Communication & Personality (Max 40 points)",
      desc: [
        "Focuses on the contestant’s mind, voice and authenticity.",
        "Q&A performance. (clarity, substance, confidence)",
        "Public speaking skills and response to the answer.",
        "Critical thinking under pressure.",
        "Personality, relatability and authenticity."
      ]
    },
    {
      title: "Talent, Advocacy & Social Relevance (Max 20 points)",
      desc: [
        "Highlights individuality, creativity and contribution.",
        "Talent performance.",
        "Advocacy or social cause presentation.",
        "Cultural awareness & representation.",
        "Passion and dedication to making an impact."
      ]
    }
  ];
  
let originalCriteriaValues = {}; 


  // Render judging criteria
  function renderCriteriaList() {
    criteriaList.innerHTML = "";
    judgingCriteria.forEach(c => {
      const titleP = document.createElement("p");
      titleP.innerHTML = `<strong>${c.title}</strong>`;
      criteriaList.appendChild(titleP);

      c.desc.forEach(line => {
        const p = document.createElement("p");
        p.textContent = line;
        criteriaList.appendChild(p);
      });

      criteriaList.appendChild(document.createElement("br"));
    });
  }

  //  Unified toggleCriteriaModal function
  function toggleCriteriaModal() {
    const isHidden = criteriaModal.classList.contains("hidden");

    if (isHidden) {
      // Open modal → default view
      criteriaList.classList.remove("hidden");
      editCriteriaBtn.classList.remove("hidden");
      criteriaEditForm.classList.add("hidden");
      criteriaActions.classList.add("hidden");
      criteriaEditForm.innerHTML = "";

      criteriaModal.classList.remove("hidden");
      criteriaModal.classList.add("flex");
    } else {
      // Close modal → reset all
      criteriaModal.classList.add("hidden");
      criteriaModal.classList.remove("flex");

      criteriaList.classList.remove("hidden");
      editCriteriaBtn.classList.remove("hidden");
      criteriaEditForm.classList.add("hidden");
      criteriaActions.classList.add("hidden");
      criteriaEditForm.innerHTML = "";
    }
  }

  // Edit button
editCriteriaBtn.addEventListener("click", () => {
  criteriaList.classList.add("hidden");
  editCriteriaBtn.classList.add("hidden");
  criteriaEditForm.classList.remove("hidden");
  criteriaActions.classList.remove("hidden");

  // Build edit form dynamically
  criteriaEditForm.innerHTML = judgingCriteria
    .map((c, i) => `
      <div class="mb-3">
        <input type="text" class="w-full border rounded-md px-2 py-1 mb-1" id="criteriaTitle_${i}" value="${c.title}">
        <textarea class="w-full border rounded-md px-2 py-1" id="criteriaDesc_${i}" rows="${c.desc.length}">${c.desc.join("\n")}</textarea>
      </div>
    `).join("");

  // ✅ Capture original values AFTER form is rendered
  originalCriteriaValues = {};
  document.querySelectorAll("#criteriaEditForm input, #criteriaEditForm textarea").forEach(el => {
    originalCriteriaValues[el.id] = el.value.trim();
  });
});

  //  Save button 
saveCriteriaBtn.addEventListener("click", () => {
  const inputs = document.querySelectorAll("#criteriaEditForm input, #criteriaEditForm textarea");
  let hasChanges = false;

  inputs.forEach(input => {
    const oldValue = originalCriteriaValues[input.id] || "";
    if (input.value.trim() !== oldValue) {
      hasChanges = true;
    }
  });

  if (hasChanges) {
    // Update judging criteria only if there are changes
    judgingCriteria = judgingCriteria.map((_, i) => {
      const title = document.getElementById(`criteriaTitle_${i}`).value.trim() || "Untitled";
      const descLines = document.getElementById(`criteriaDesc_${i}`).value
        .split("\n")
        .map(l => l.trim())
        .filter(l => l !== "");
      return { title, desc: descLines.length ? descLines : ["No description provided."] };
    });

    renderCriteriaList();

    // ✅ Show success message
    const messageEl = document.getElementById("criteriaSaveMessage");
    messageEl.classList.add("show");
    if (messageEl.fadeTimeout) clearTimeout(messageEl.fadeTimeout);
    messageEl.fadeTimeout = setTimeout(() => messageEl.classList.remove("show"), 3000);

    // Update stored originals
    inputs.forEach(input => {
      originalCriteriaValues[input.id] = input.value.trim();
    });
  } else {
    console.log("No changes detected → nothing saved.");
  }

  // Restore view safely
  criteriaEditForm.classList.add("hidden");
  criteriaActions.classList.add("hidden");
  criteriaList.classList.remove("hidden");
  editCriteriaBtn.classList.remove("hidden");
});

  // Cancel button 
  cancelCriteriaBtn.addEventListener("click", () => {
    criteriaEditForm.classList.add("hidden");
    criteriaActions.classList.add("hidden");
    criteriaList.classList.remove("hidden");
    editCriteriaBtn.classList.remove("hidden");
    criteriaEditForm.innerHTML = "";
  });

  // Default view
  showSection("dashboard");
  renderCriteriaList();


  // === DOM Elements ===
const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");
const showSignInBtn = document.getElementById("showSignIn");
const showSignUpBtn = document.getElementById("showSignUp");

// === Toggle Sign In / Sign Up Forms ===
if (showSignInBtn && showSignUpBtn) {
  showSignInBtn.addEventListener("click", () => {
    signUpForm?.classList.add("hidden");
    signInForm?.classList.remove("hidden");
  });

  showSignUpBtn.addEventListener("click", () => {
    signInForm?.classList.add("hidden");
    signUpForm?.classList.remove("hidden");
  });
}

// === LocalStorage Helpers ===
function saveUser(username, password) {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  users.push({ username, password });
  localStorage.setItem("users", JSON.stringify(users));
}

function findUser(username, password) {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  return users.find(u => u.username === username && u.password === password);
}

// === Sign Up Logic ===
signUpForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const usernameInput = document.getElementById("signupUsername");
  const passwordInput = document.getElementById("signupPassword");

  if (!usernameInput || !passwordInput) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Please fill all fields.");
    return;
  }

  saveUser(username, password);
  alert("Account created successfully! You can now sign in.");

  signUpForm.classList.add("hidden");
  signInForm.classList.remove("hidden");
});

// === Sign In Logic ===
signInForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const usernameInput = document.getElementById("signinUsername");
  const passwordInput = document.getElementById("signinPassword");

  if (!usernameInput || !passwordInput) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Please fill all fields.");
    return;
  }

  const user = findUser(username, password);

  if (!user) {
    alert("Invalid username or password!");
    return;
  }

  // Store current user in localStorage
  localStorage.setItem("currentUser", user.username);

  const uname = user.username.toLowerCase();
  if (uname.includes("admin")) {
    window.location.href = "admin.html";
  } else if (uname.includes("judge")) {
    window.location.href = "judge.html";
  } else {
    alert("Unknown role! Contact your system administrator.");
  }
});

// === Admin / Judge Page Access Control ===
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return; // Not logged in, let login page handle redirection
});
