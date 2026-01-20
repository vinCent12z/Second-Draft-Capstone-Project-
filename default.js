document.addEventListener("DOMContentLoaded", () => {
  // === Modal Elements (initial query) ===
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const closeLogin = document.getElementById("closeLogin");
  const closeSignup = document.getElementById("closeSignup");
  const loginSubmit = document.getElementById("loginSubmit");
  const signupSubmit = document.getElementById("signupSubmit");
  const loginLink = document.getElementById("loginLink");     // from signup → login
  const signupLink = document.getElementById("signupLink");   // from login → signup
  const forgotPassword = document.getElementById("forgotPassword");

  // === LocalStorage Key ===
  const usersKey = "allUsers";

  // === Helpers ===
  function getUsers() {
    return JSON.parse(localStorage.getItem(usersKey)) || [];
  }
  function saveUsers(users) {
    localStorage.setItem(usersKey, JSON.stringify(users));
  }

  // --- Clear helpers: reset inputs and inline messages ---
  function clearLoginFields() {
    const u = document.getElementById("loginUsername");
    const p = document.getElementById("loginPassword");
    const msg = document.getElementById("loginMessage");
    if (u) u.value = "";
    if (p) {
      p.value = "";
      p.type = "password";
    }
    if (msg) {
      msg.textContent = "";
      msg.classList.add("hidden");
      msg.setAttribute("aria-hidden", "true");
    }
    // reset eye icon if present
    const toggle = document.getElementById("toggleLoginPassword");
    if (toggle) {
      toggle.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round"
             d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
           <path stroke-linecap="round" stroke-linejoin="round"
             d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
    }
  }

  function clearSignupFields() {
    const u = document.getElementById("signupUsername");
    const p = document.getElementById("signupPassword");
    const c = document.getElementById("signupConfirmPassword");
    const msg = document.getElementById("signupMessage");
    if (u) u.value = "";
    if (p) {
      p.value = "";
      p.type = "password";
    }
    if (c) {
      c.value = "";
      c.type = "password";
    }
    if (msg) {
      msg.textContent = "";
      msg.classList.add("hidden");
      msg.setAttribute("aria-hidden", "true");
    }
    // reset eye icons if present
    const t1 = document.getElementById("toggleSignupPassword");
    const t2 = document.getElementById("toggleConfirmPassword");
    const defaultEye = `<path stroke-linecap="round" stroke-linejoin="round"
             d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
           <path stroke-linecap="round" stroke-linejoin="round"
             d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
    if (t1) t1.innerHTML = defaultEye;
    if (t2) t2.innerHTML = defaultEye;
  }

  // Optional: clear recovery/reset fields when opened
  function clearRecoveryFields() {
    const r = document.getElementById("recoveryUsername");
    const msg = document.getElementById("recoveryMessage");
    if (r) r.value = "";
    if (msg) { msg.textContent = ""; msg.classList.add("hidden"); msg.setAttribute("aria-hidden", "true"); }
  }
  function clearResetFields() {
    const p = document.getElementById("resetPassword");
    const c = document.getElementById("resetConfirmPassword");
    const msg = document.getElementById("resetMessage");
    if (p) { p.value = ""; p.type = "password"; }
    if (c) { c.value = ""; c.type = "password"; }
    if (msg) { msg.textContent = ""; msg.classList.add("hidden"); msg.setAttribute("aria-hidden", "true"); }
    // reset eye icons if present
    const t1 = document.getElementById("toggleResetPassword");
    const t2 = document.getElementById("toggleResetConfirmPassword");
    const defaultEye = `<path stroke-linecap="round" stroke-linejoin="round"
             d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
           <path stroke-linecap="round" stroke-linejoin="round"
             d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
    if (t1) t1.innerHTML = defaultEye;
    if (t2) t2.innerHTML = defaultEye;
  }

  // === Floating Toast Function ===
  function showToast(message, type = "error", duration = 3000) {
    const container = document.getElementById("toastContainer");
    if (!container) {
      console[type === "error" ? "error" : "log"](message);
      return;
    }

    const toast = document.createElement("div");
    toast.classList.add("toast", type === "error" ? "toast-error" : "toast-success");

    const icon = document.createElement("span");
    icon.classList.add("toast-icon");
    icon.textContent = "";

    const text = document.createElement("span");
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("toast-show"), 50);
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 500);
    }, duration);
  }

  // === Ensure Recovery/Reset Modals Exist (create minimal markup if missing) ===
  function ensureRecoveryResetModals() {
    if (!document.getElementById("recoveryModal")) {
      const recoveryHtml = `
        <div id="recoveryModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white text-gray-800 rounded-2xl shadow-lg w-96 p-8 relative animate-fadeIn">
            <button id="closeRecovery" type="button" aria-label="Close recovery modal"
              class="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke-width="2" stroke="currentColor" class="w-6 h-6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 class="text-2xl font-bold mb-4 text-center text-green-600">Recover Password</h3>
            <p class="text-sm mb-4 text-gray-600 text-center">Enter your username to request recovery.</p>
            <input id="recoveryUsername" type="text" placeholder="Username *" class="input-field mb-4">
            <button id="recoverySubmit" type="button" class="modal-btn mb-3 bg-green-500 text-white hover:bg-green-600">Send Request</button>
          </div>
        </div>`;
      document.body.insertAdjacentHTML("beforeend", recoveryHtml);
    }

    if (!document.getElementById("resetModal")) {
      const resetHtml = `
        <div id="resetModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white text-gray-800 rounded-2xl shadow-lg w-96 p-8 relative animate-fadeIn">
            <button id="closeReset" type="button" aria-label="Close reset modal"
              class="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke-width="2" stroke="currentColor" class="w-6 h-6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 class="text-2xl font-bold mb-4 text-center text-blue-600">Reset Password</h3>
            <p class="text-sm mb-4 text-gray-600 text-center">Enter your new password below.</p>
            <div class="relative mb-4">
              <input id="resetPassword" type="password" placeholder="New Password *" class="input-field pr-10">
            </div>
            <div class="relative mb-6">
              <input id="resetConfirmPassword" type="password" placeholder="Confirm New Password *" class="input-field pr-10">
            </div>
            <button id="resetSubmit" type="button" class="modal-btn mb-3 bg-blue-600 text-white hover:bg-blue-700">Update Password</button>
          </div>
        </div>`;
      document.body.insertAdjacentHTML("beforeend", resetHtml);
    }
  }

  // Ensure modals exist before wiring handlers
  ensureRecoveryResetModals();

  // === Re-query recovery/reset elements after ensuring they exist ===
  const recoveryModal = document.getElementById("recoveryModal");
  const recoverySubmit = document.getElementById("recoverySubmit");
  const closeRecovery = document.getElementById("closeRecovery");
  const recoveryUsernameInput = document.getElementById("recoveryUsername");

  const resetModal = document.getElementById("resetModal");
  const resetSubmit = document.getElementById("resetSubmit");
  const closeReset = document.getElementById("closeReset");
  const resetPasswordInput = document.getElementById("resetPassword");
  const resetConfirmInput = document.getElementById("resetConfirmPassword");

  // === Modal Toggle Helper ===
  function toggleModal(showModal, hideModal) {
    if (hideModal) hideModal.classList.add("hidden");
    if (showModal) showModal.classList.remove("hidden");
  }

  // === Show/Hide Modals (openers) ===
  if (loginBtn && loginModal) loginBtn.addEventListener("click", () => { clearLoginFields(); toggleModal(loginModal); });
  if (signupBtn && signupModal) signupBtn.addEventListener("click", () => { clearSignupFields(); toggleModal(signupModal); });
  if (loginLink && signupModal && loginModal) loginLink.addEventListener("click", () => { clearLoginFields(); toggleModal(loginModal, signupModal); });
  if (signupLink && signupModal && loginModal) signupLink.addEventListener("click", () => { clearSignupFields(); toggleModal(signupModal, loginModal); });

  // === CLOSE only via top-right X buttons (no overlay click, no Escape) ===
  if (closeLogin && loginModal) closeLogin.addEventListener("click", () => { loginModal.classList.add("hidden"); clearLoginFields(); });
  if (closeSignup && signupModal) closeSignup.addEventListener("click", () => { signupModal.classList.add("hidden"); clearSignupFields(); });
  if (closeRecovery && recoveryModal) closeRecovery.addEventListener("click", () => { recoveryModal.classList.add("hidden"); clearRecoveryFields(); });
  if (closeReset && resetModal) closeReset.addEventListener("click", () => { resetModal.classList.add("hidden"); clearResetFields(); });

  // === Eye Icon Toggle Logic (Reusable) ===
  function setupPasswordToggle(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    let isVisible = false;
    const originalPlaceholder = input.placeholder || "";

    icon.addEventListener("click", () => {
      isVisible = !isVisible;
      input.type = isVisible ? "text" : "password";

      icon.innerHTML = isVisible
        ? `<path stroke-linecap="round" stroke-linejoin="round"
             d="M3 3l18 18M9.88 9.88a3 3 0 104.24 4.24M6.75 6.75C4.5 8.25 2.25 12 2.25 12s3.75 6.75 9.75 6.75c1.5 0 2.91-.33 4.2-.92M17.25 17.25C19.5 15.75 21.75 12 21.75 12s-3.75-6.75-9.75-6.75c-.84 0-1.65.1-2.43.29" />`
        : `<path stroke-linecap="round" stroke-linejoin="round"
             d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
           <path stroke-linecap="round" stroke-linejoin="round"
             d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;

      if (isVisible && !input.value.trim()) input.placeholder = "";
      if (!isVisible && !input.value.trim()) input.placeholder = originalPlaceholder;
    });

    input.addEventListener("blur", () => {
      if (!input.value.trim()) input.placeholder = originalPlaceholder;
    });
  }

  // Apply to known password fields (safe guards)
  setupPasswordToggle("signupPassword", "toggleSignupPassword");
  setupPasswordToggle("signupConfirmPassword", "toggleConfirmPassword");
  setupPasswordToggle("loginPassword", "toggleLoginPassword");
  setupPasswordToggle("resetPassword", "toggleResetPassword");
  setupPasswordToggle("resetConfirmPassword", "toggleResetConfirmPassword");

  // === SIGNUP LOGIC ===
  if (signupSubmit) {
    signupSubmit.addEventListener("click", () => {
      const username = document.getElementById("signupUsername").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      const confirmPassword = document.getElementById("signupConfirmPassword").value.trim();

      if (!username || !password || !confirmPassword) {
        showToast("Please fill in all fields.", "error"); return;
      }
      if (/\s/.test(username) || /\s/.test(password)) {
        showToast("Username and password cannot contain spaces.", "error"); return;
      }
      if (username === "admin" || username === "judge") {
        showToast("Username cannot be just 'admin' or 'judge'.", "error"); return;
      }
      if (username === password) {
        showToast("Username and password cannot be the same.", "error"); return;
      }
      if (password !== confirmPassword) {
        showToast("Passwords do not match.", "error"); return;
      }

      let role;
      if (username.includes("admin") && !username.includes("judge")) role = "admin";
      else if (username.includes("judge") && !username.includes("admin")) role = "judge";
      else {
        showToast("Username must contain lowercase 'admin' or 'judge' only.", "error"); return;
      }

      const users = getUsers();
      if (users.find(u => u.username === username)) {
        showToast("Username already exists. Choose a different one.", "error"); return;
      }

      users.push({ username, password, role });
      saveUsers(users);

      showToast(`${role.toUpperCase()} account created successfully!`, "success");
      if (signupModal) signupModal.classList.add("hidden");

      // clear fields after successful signup
      clearSignupFields();
    });
  }

  // === LOGIN LOGIC ===
  if (loginSubmit) {
    loginSubmit.addEventListener("click", () => {
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      if (!username || !password) { showToast("Please fill in all fields.", "error"); return; }
      if (username === "admin" || username === "judge") { showToast("Invalid username.", "error"); return; }
      if (!username.includes("admin") && !username.includes("judge")) {
        showToast("Username must contain lowercase 'admin' or 'judge'.", "error"); return;
      }

      const users = getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (!user) { showToast("Invalid username or password.", "error"); return; }

      localStorage.setItem("currentUser", user.username);
      localStorage.setItem("currentRole", user.role);
      showToast(`Welcome back, ${user.username}!`, "success");

      setTimeout(() => {
        if (user.role === "admin") window.location.href = "admin.html";
        else window.location.href = "judge.html";
      }, 1000);
    });
  }

  // === FORGOT PASSWORD FLOW ===
  if (forgotPassword && recoveryModal && recoverySubmit && recoveryUsernameInput && resetModal && resetSubmit && resetPasswordInput && resetConfirmInput) {
    // Open recovery modal from login
    forgotPassword.addEventListener("click", () => {
      if (loginModal) loginModal.classList.add("hidden");
      clearRecoveryFields();
      recoveryModal.classList.remove("hidden");
      recoveryUsernameInput.focus();
    });

    // Close handlers (explicit X buttons)
    if (closeRecovery) closeRecovery.addEventListener("click", () => { recoveryModal.classList.add("hidden"); clearRecoveryFields(); });
    if (closeReset) closeReset.addEventListener("click", () => { resetModal.classList.add("hidden"); clearResetFields(); });

    // Recovery submit -> validate username and open reset modal
    recoverySubmit.addEventListener("click", () => {
      const username = recoveryUsernameInput.value.trim();
      if (!username) {
        showToast("Please enter your username.", "error");
        return;
      }

      const users = getUsers();
      const user = users.find(u => u.username === username);
      if (!user) {
        showToast("Username not found.", "error");
        return;
      }

      showToast(`Recovery request accepted for ${username}.`, "success");
      recoveryModal.classList.add("hidden");

      resetModal.dataset.username = username;
      clearResetFields();
      resetModal.classList.remove("hidden");
      resetPasswordInput.value = "";
      resetConfirmInput.value = "";
      resetPasswordInput.focus();
    });

    // Reset submit -> update password
    resetSubmit.addEventListener("click", () => {
      const newPass = resetPasswordInput.value.trim();
      const confirmPass = resetConfirmInput.value.trim();
      const username = resetModal.dataset.username;

      if (!newPass || !confirmPass) {
        showToast("Please fill out both fields.", "error");
        return;
      }
      if (newPass !== confirmPass) {
        showToast("Passwords do not match.", "error");
        return;
      }
      if (/\s/.test(newPass)) {
        showToast("Password cannot contain spaces.", "error");
        return;
      }

      let users = getUsers();
      users = users.map(u => u.username === username ? { ...u, password: newPass } : u);
      saveUsers(users);

      showToast("Password updated successfully!", "success");
      resetModal.classList.add("hidden");

      delete resetModal.dataset.username;
      clearResetFields();
    });
  } else {
    // graceful fallback if recovery/reset elements are missing
    if (forgotPassword) {
      forgotPassword.addEventListener("click", () => {
        showToast("Password recovery is not available right now.", "error");
      });
    }
  }

  // === Google Identity callback for client-side sign-in ===
  // This function is called by the Google Identity Services script when the user signs in.
  // IMPORTANT: For production security, send the ID token to your server and verify it there.
  window.handleCredentialResponse = function(response) {
    try {
      if (!response || !response.credential) {
        showToast("Google sign-in failed.", "error");
        return;
      }
      const idToken = response.credential;
      const payload = JSON.parse(atob(idToken.split('.')[1] || ''));
      if (!payload || !payload.email) {
        showToast("Unable to read Google token.", "error");
        return;
      }

      // Example role inference (adjust to your rules)
      let role = "user";
      const email = (payload.email || "").toLowerCase();
      if (email.includes("admin") && !email.includes("judge")) role = "admin";
      else if (email.includes("judge") && !email.includes("admin")) role = "judge";

      // Save minimal info locally (for demo). For real auth, verify token server-side.
      localStorage.setItem("currentUser", payload.email);
      localStorage.setItem("currentRole", role);

      showToast(`Signed in as ${payload.email}`, "success");

      // Close login modal and clear fields
      if (loginModal) {
        loginModal.classList.add("hidden");
        clearLoginFields();
      }

      setTimeout(() => {
        if (role === "admin") window.location.href = "admin.html";
        else if (role === "judge") window.location.href = "judge.html";
        else window.location.href = "index.html";
      }, 900);
    } catch (err) {
      console.error(err);
      showToast("Error processing Google sign-in.", "error");
    }
  };
});
