// ... your previous variables and functions (assignments, mcqs, render functions etc.) ...

let currentRole = localStorage.getItem("masasaRole") || null;

const TEACHER_EMAIL_SUFFIX = "@masasaadmin.ke";
const TEACHER_PASSWORD = "Masasa2026!"; // CHANGE THIS IN PRODUCTION!

function showWelcomeOverlay() {
  document.getElementById("role-overlay").classList.remove("hidden");
  document.getElementById("main-header").classList.add("hidden");
  document.getElementById("main-content").classList.add("hidden");
}

function hideWelcomeOverlay() {
  document.getElementById("role-overlay").classList.add("hidden");
  document.getElementById("main-header").classList.remove("hidden");
  document.getElementById("main-content").classList.remove("hidden");
}

function selectRole(role) {
  currentRole = role;
  localStorage.setItem("masasaRole", role);
  applyTheme();
  hideWelcomeOverlay();
  renderAll(); // your existing render function
  switchRole(role); // your existing function if you have it
}

function showTeacherLogin() {
  document.getElementById("teacher-login").classList.remove("hidden");
}

function hideTeacherLogin() {
  document.getElementById("teacher-login").classList.add("hidden");
  document.getElementById("teacher-email").value = "";
  document.getElementById("teacher-pass").value = "";
}

function validateTeacher() {
  const email = document.getElementById("teacher-email").value.trim().toLowerCase();
  const pass = document.getElementById("teacher-pass").value;

  if (email.endsWith(TEACHER_EMAIL_SUFFIX) && pass === TEACHER_PASSWORD) {
    selectRole("teacher");
  } else {
    alert("Invalid credentials! Please use the admin email and password provided.");
  }
}

function resetRole() {
  if (confirm("Change your role? You'll see the welcome screen again.")) {
    localStorage.removeItem("masasaRole");
    currentRole = null;
    showWelcomeOverlay();
  }
}

function applyTheme() {
  const body = document.body;
  const styleEl = document.getElementById("dynamic-styles");

  if (currentRole === "learner" || currentRole === "parent") {
    body.classList.add("learner-theme");
    styleEl.innerHTML = `
      button { background-color: #FF6B6B !important; }
      button:hover { background-color: #FF4757 !important; }
      h2 { color: #FFD93D !important; }
      .card { border-color: #4ECDC4 !important; }
    `;
  } else if (currentRole === "teacher") {
    body.classList.remove("learner-theme");
    styleEl.innerHTML = ""; // reset to default (indigo)
  }
}

// On page load
window.onload = () => {
  loadData(); // your previous data load

  if (!currentRole) {
    showWelcomeOverlay();
  } else {
    selectRole(currentRole); // apply saved role
  }

  // ... your other init code (switchTab(0), renderAll(), etc.)
};
