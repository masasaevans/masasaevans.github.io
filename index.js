/*
 * Masasa Online – Educational web app
 * Copyright (c) 2026 [your name or "young"]
 * Licensed under MIT (or choose your license)
 */

const ADMIN_USER = "admin";
const ADMIN_PASS = "Miritini123";

// Using Sunday story for all days during development
const WEEKLY_ENGLISH_STORIES = [
  {
    title: "The Singing Matatu",
    story: "Every Sunday morning in Eastlands, little Zawadi loved riding the number 19 matatu. One day the radio stopped working, but the passengers started singing old nyatiti songs together. The driver joined in with a deep voice. By the time they reached town, everyone was smiling. Zawadi learned that music can turn any journey into a happy one.",
    questions: [
      {q:"When does Zawadi usually ride the matatu?", o:["Saturday","Sunday","Monday","Friday"], c:1},
      {q:"What broke in the matatu?", o:["Engine","Radio","Door","Seats"], c:1},
      {q:"What did passengers start doing?", o:["Arguing","Singing","Sleeping","Eating"], c:1},
      {q:"Which instrument is mentioned?", o:["Guitar","Nyatiti","Piano","Drum"], c:1},
      {q:"Who had a deep voice?", o:["Zawadi","Driver","Child","Old lady"], c:1},
      {q:"Where did they reach?", o:["Village","Town","School","Market"], c:1},
      {q:"What did Zawadi learn?", o:["Music is expensive","Music makes journeys happy","Matatus are fast","Singing is bad"], c:1},
      {q:"What kind of songs?", o:["New pop","Old nyatiti","School","None"], c:1},
      {q:"How did people feel at the end?", o:["Angry","Sad","Smiling","Tired"], c:2},
      {q:"Main lesson?", o:["Never ride matatus","Music brings joy","Radios are important","Sundays are boring"], c:1}
    ]
  },
  // Repeat Sunday story for other days (you can replace later)
  ...Array(6).fill(null).map(() => WEEKLY_ENGLISH_STORIES[0])
];

let currentRole = localStorage.getItem("masasaRole") || null;
let assignments = JSON.parse(localStorage.getItem("assignments") || "[]");
let teachers   = JSON.parse(localStorage.getItem("teachers")   || "[]");
let englishAnswers = new Array(10).fill(null);
let currentQuestions = [];

// ──────────────────────────────────────────────
// Date / Time / Weather
// ──────────────────────────────────────────────
async function updateDateTimeAndWeather() {
  document.getElementById("datetime").textContent = new Date().toLocaleString("en-KE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  });

  if (!navigator.geolocation) {
    document.getElementById("weather-text").textContent = "Location not supported";
    return;
  }

  navigator.geolocation.getCurrentPosition(async ({ coords: { latitude, longitude } }) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=Africa/Nairobi`);
      const { current } = await res.json();
      const temp = Math.round(current.temperature_2m);
      const code = current.weather_code;
      let icon = "☀️";
      if ([51,53,55,61,63,65,80,81,82].includes(code)) icon = "🌧️";
      else if ([71,73,75,77].includes(code)) icon = "❄️";
      else if ([95,96,99].includes(code)) icon = "⛈️";
      document.getElementById("weather-text").textContent = `${temp}°C • ${icon}`;
      document.getElementById("weather-icon").textContent = icon;
    } catch {
      document.getElementById("weather-text").textContent = "Weather unavailable";
    }
  }, () => {
    document.getElementById("weather-text").textContent = "Location access denied";
  });
}

// ──────────────────────────────────────────────
// Role / Overlay logic
// ──────────────────────────────────────────────
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
  hideWelcomeOverlay();
  renderAll();
  switchTab(0);
}

function showTeacherLogin() { document.getElementById("teacher-login").classList.remove("hidden"); }
function hideTeacherLogin() { document.getElementById("teacher-login").classList.add("hidden"); }

function validateTeacher() {
  const u = document.getElementById("teacher-username").value.trim();
  const p = document.getElementById("teacher-pass").value;
  if (teachers.some(t => t.username === u && t.password === p)) {
    selectRole("teacher");
  } else {
    alert("Wrong username or password");
  }
}

function resetRole() {
  if (confirm("Change role? Unsaved work will be lost.")) {
    localStorage.removeItem("masasaRole");
    currentRole = null;
    showWelcomeOverlay();
  }
}

function toggleVisibility(btn) {
  const input = btn.closest('.relative').querySelector('input');
  input.type = input.type === "password" ? "text" : "password";
  btn.textContent = input.type === "password" ? "👁️" : "🙈";
}

// ──────────────────────────────────────────────
// Admin panel
// ──────────────────────────────────────────────
function showAdminPanel() { document.getElementById("admin-modal").classList.remove("hidden"); }

function loginAdmin() {
  const u = document.getElementById("admin-user").value.trim();
  const p = document.getElementById("admin-pass").value;
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    document.getElementById("admin-panel").classList.remove("hidden");
    renderTeacherList();
  } else {
    alert("Incorrect admin credentials");
  }
}

function logoutAdmin() {
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("admin-pass").value = "";
}

function renderTeacherList() {
  const list = document.getElementById("teacher-list");
  list.innerHTML = teachers.length
    ? teachers.map(t => `
        <div class="flex justify-between bg-white p-3 rounded-xl mb-2 shadow-sm text-sm">
          <span class="font-medium">${t.username}</span>
          <span class="text-emerald-600">Pass: ${t.password}</span>
        </div>
      `).join("")
    : `<p class="text-gray-400 italic p-3">No teachers yet</p>`;
}

function addNewTeacher() {
  const u = document.getElementById("new-teacher-user").value.trim();
  const p = document.getElementById("new-teacher-pass").value.trim();
  if (!u || !p) return alert("Both fields required");
  if (teachers.some(t => t.username === u)) return alert("Username already exists");

  teachers.push({ username: u, password: p });
  localStorage.setItem("teachers", JSON.stringify(teachers));
  renderTeacherList();
  alert(`Teacher ${u} added! Password: ${p}`);
}

function closeAdminModal() {
  document.getElementById("admin-modal").classList.add("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("admin-pass").value = "";
}

// ──────────────────────────────────────────────
// Assignments
// ──────────────────────────────────────────────
function addAssignment() {
  const title = document.getElementById("ass-title").value.trim();
  if (!title) return alert("Title is required");

  const desc = document.getElementById("ass-desc").value.trim();
  const pdfNameInput = document.getElementById("ass-pdf-name").value.trim();
  const file = document.getElementById("ass-pdf-file").files[0];

  // Reset form
  document.getElementById("ass-title").value = "";
  document.getElementById("ass-desc").value = "";
  document.getElementById("ass-pdf-name").value = "";
  document.getElementById("ass-pdf-file").value = "";

  const entry = { id: Date.now(), title, desc, pdfName: null, pdfData: null };

  if (!file) {
    assignments.unshift(entry);
    localStorage.setItem("assignments", JSON.stringify(assignments));
    renderAssignments();
    return;
  }

  entry.pdfName = pdfNameInput || file.name;
  const reader = new FileReader();
  reader.onload = e => {
    entry.pdfData = e.target.result;
    assignments.unshift(entry);
    localStorage.setItem("assignments", JSON.stringify(assignments));
    renderAssignments();
  };
  reader.onerror = () => alert("Failed to read file");
  reader.readAsDataURL(file);
}

function renderAssignments() {
  const container = document.getElementById("assignments-list");
  container.innerHTML = assignments.length
    ? assignments.map(ass => {
        const hasPdf = !!ass.pdfData;
        return `
          <div class="bg-white p-5 sm:p-6 rounded-2xl shadow hover:shadow-lg transition">
            <h3 class="font-bold text-lg mb-2">${ass.title}</h3>
            <p class="text-gray-600 mb-4 line-clamp-3">${ass.desc || "No description"}</p>
            ${hasPdf ? `
              <div class="flex flex-col sm:flex-row gap-3">
                <button onclick="openAssignmentPdf(${ass.id})" class="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex-1 hover:bg-blue-700">
                  Open PDF
                </button>
                <button onclick="downloadAssignmentPdf(${ass.id})" class="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex-1 hover:bg-emerald-700">
                  Download
                </button>
              </div>
            ` : `<p class="text-amber-600 text-sm mt-2">No PDF attached</p>`}
          </div>
        `;
      }).join("")
    : `<p class="text-center text-gray-500 py-10">No assignments yet</p>`;
}

function openAssignmentPdf(id) {
  const ass = assignments.find(a => a.id === id);
  if (ass?.pdfData) window.open(ass.pdfData, "_blank");
}

function downloadAssignmentPdf(id) {
  const ass = assignments.find(a => a.id === id);
  if (!ass?.pdfData) return;
  const a = document.createElement("a");
  a.href = ass.pdfData;
  a.download = ass.pdfName || `${ass.title}.pdf`;
  a.click();
}

// ──────────────────────────────────────────────
// Daily English Quiz
// ──────────────────────────────────────────────
function renderDailyEnglish() {
  const story = WEEKLY_ENGLISH_STORIES[0];
  document.getElementById("english-title").textContent =
    `Daily English: ${story.title} (${new Date().toLocaleDateString('en-KE', {weekday:'long'})})`;

  document.getElementById("story-box").innerHTML = `<strong>Story:</strong><br>${story.story}`;

  currentQuestions = story.questions;
  englishAnswers.fill(null);

  document.getElementById("english-questions").innerHTML = story.questions.map((q, i) => `
    <div class="mb-6">
      <p class="font-semibold mb-3">${i+1}. ${q.q}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${q.o.map((opt, idx) => `
          <label class="flex items-center gap-3 p-3 sm:p-4 border rounded-xl cursor-pointer hover:bg-yellow-50 transition">
            <input type="radio" name="q${i}" value="${idx}" onchange="englishAnswers[${i}]=${idx}" class="w-5 h-5 accent-green-600">
            <span>${opt}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function submitEnglishQuiz() {
  if (englishAnswers.includes(null)) return alert("Please answer all 10 questions");

  let correct = 0;
  englishAnswers.forEach((ans, i) => {
    if (ans === currentQuestions[i].c) correct++;
  });

  const percent = Math.round((correct / 10) * 100);
  const emoji = percent >= 80 ? "🎉🥳🔥" : percent >= 50 ? "👏😊" : "📚💪";
  const msg = percent >= 90 ? "Outstanding!" :
              percent >= 70 ? "Great job!" :
              percent >= 50 ? "Good effort!" : "Keep practicing!";

  document.getElementById("english-questions").innerHTML = `
    <div class="score-popup">
      <div class="text-6xl mb-4">${emoji}</div>
      <h3 class="text-5xl font-bold mb-3">${percent}%</h3>
      <p class="text-xl mb-2">${correct}/10 correct</p>
      <p class="text-lg mb-6">${msg}</p>
      <button onclick="renderDailyEnglish()" class="bg-white text-emerald-800 px-8 py-3 rounded-xl font-bold hover:bg-gray-100">
        Try Again Tomorrow
      </button>
    </div>
  `;
}

// ──────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────
function switchTab(idx) {
  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${idx}`).classList.add("active");

  document.querySelectorAll("section[id$='-section']").forEach(s => s.classList.add("hidden"));
  document.getElementById(`${["assignments","quizzes","english"][idx]}-section`).classList.remove("hidden");

  if (idx === 2) renderDailyEnglish();
}

function renderAll() {
  const isTeacher = currentRole === "teacher";
  document.getElementById("teacher-assignments-form")?.classList.toggle("hidden", !isTeacher);
  renderAssignments();
}

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
window.addEventListener("load", () => {
  if (!currentRole) {
    showWelcomeOverlay();
  } else {
    hideWelcomeOverlay();
    selectRole(currentRole);
  }
  updateDateTimeAndWeather();
  setInterval(updateDateTimeAndWeather, 600_000);
  renderAll();
});
