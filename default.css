document.addEventListener("DOMContentLoaded", () => {
  // === Modal Elements ===
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const closeLogin = document.getElementById("closeLogin");
  const closeSignup = document.getElementById("closeSignup");
  const loginSubmit = document.getElementById("loginSubmit");
  const signupSubmit = document.getElementById("signupSubmit");

  // === Show/Hide Modals ===
  loginBtn.addEventListener("click", () => loginModal.classList.remove("hidden"));
  signupBtn.addEventListener("click", () => signupModal.classList.remove("hidden"));
  closeLogin.addEventListener("click", () => loginModal.classList.add("hidden"));
  closeSignup.addEventListener("click", () => signupModal.classList.add("hidden"));

  // === LocalStorage Key ===
  const usersKey = "allUsers";

  // === Helpers ===
  function getUsers() {
    return JSON.parse(localStorage.getItem(usersKey)) || [];
  }

  function saveUsers(users) {
    localStorage.setItem(usersKey, JSON.stringify(users));
  }

  // === Floating Toast Function ===
  function showToast(message, type = "error", duration = 3000) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.classList.add("toast", type === "error" ? "toast-error" : "toast-success");
    toast.textContent = message;
    container.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add("toast-show"), 50);

    // Auto-hide after duration
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // === SIGNUP LOGIC ===
  signupSubmit.addEventListener("click", () => {
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    if (!username || !password) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    let role;
    if (username.includes("admin") && !username.includes("judge")) role = "admin";
    else if (username.includes("judge") && !username.includes("admin")) role = "judge";
    else {
      showToast("Username must contain lowercase 'admin' or 'judge' only.", "error");
      return;
    }

    const users = getUsers();
    if (users.find(u => u.username === username)) {
      showToast("Username already exists. Choose a different one.", "error");
      return;
    }

    users.push({ username, password, role });
    saveUsers(users);

    showToast(`${role.toUpperCase()} account created successfully!`, "success");
    signupModal.classList.add("hidden");

    document.getElementById("signupUsername").value = "";
    document.getElementById("signupPassword").value = "";
  });

  // === LOGIN LOGIC ===
  loginSubmit.addEventListener("click", () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!username || !password) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    if (!username.includes("admin") && !username.includes("judge")) {
      showToast("Username must contain lowercase 'admin' or 'judge'.", "error");
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      showToast("Invalid username or password.", "error");
      return;
    }

    localStorage.setItem("currentUser", user.username);
    localStorage.setItem("currentRole", user.role);

    showToast(`Welcome back, ${user.username}!`, "success");

    setTimeout(() => {
      if (user.role === "admin") window.location.href = "admin.html";
      else window.location.href = "judge.html";
    }, 1000);
  });
});
