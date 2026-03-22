// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────
const TEACHER_EMAIL_SUFFIX = "@masasaadmin.ke";
const TEACHER_PASSWORD     = "Masasa2026!";      // ← Change this in real usage!

const SAMPLE_PDF = "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-pdf-file.pdf";

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────
let currentRole = localStorage.getItem("masasaRole") || null;
let assignments  = [];
let mcqs         = [];
let quizQuestions = [];
let currentAnswers = [];

// ──────────────────────────────────────────────
// DOM Elements Cache (optional but cleaner)
// ──────────────────────────────────────────────
const els = {
  roleOverlay:     () => document.getElementById("role-overlay"),
  teacherLogin:    () => document.getElementById("teacher-login"),
  mainHeader:      () => document.getElementById("main-header"),
  mainContent:     () => document.getElementById("main-content"),
  startQuizBtn:    () => document.getElementById("start-quiz-btn"),
  assignmentsList: () => document.getElementById("assignments-list"),
  mcqList:         () => document.getElementById("mcq-list"),
  quizQuestions:   () => document.getElementById("quiz-questions"),
  tab0:            () => document.getElementById("tab-0"),
  tab1:            () => document.getElementById("tab-1"),
};

// ──────────────────────────────────────────────
// Role & Theme Logic
// ──────────────────────────────────────────────
function showWelcomeOverlay() {
  els.roleOverlay().classList.remove("hidden");
  els.mainHeader().classList.add("hidden");
  els.mainContent().classList.add("hidden");
}

function hideWelcomeOverlay() {
  els.roleOverlay().classList.add("hidden");
  els.mainHeader().classList.remove("hidden");
  els.mainContent().classList.remove("hidden");
}

function selectRole(role) {
  currentRole = role;
  localStorage.setItem("masasaRole", role);
  applyTheme(role);
  hideWelcomeOverlay();
  renderAll();
  switchTab(0);
}

function showTeacherLogin() {
  els.teacherLogin().classList.remove("hidden");
}

function hideTeacherLogin() {
  els.teacherLogin().classList.add("hidden");
  document.getElementById("teacher-email").value = "";
  document.getElementById("teacher-pass").value = "";
}

function validateTeacher() {
  const email = document.getElementById("teacher-email").value.trim().toLowerCase();
  const pass  = document.getElementById("teacher-pass").value;

  if (email.endsWith(TEACHER_EMAIL_SUFFIX) && pass === TEACHER_PASSWORD) {
    selectRole("teacher");
  } else {
    alert("Sorry! Invalid admin credentials.\nUse the email and password provided by the system admin.");
  }
}

function resetRole() {
  if (confirm("Switch role? You will see the welcome screen again.")) {
    localStorage.removeItem("masasaRole");
    currentRole = null;
    showWelcomeOverlay();
  }
}

function applyTheme(role) {
  const body = document.body;
  if (role === "learner" || role === "parent") {
    body.classList.add("learner-theme");
  } else {
    body.classList.remove("learner-theme");
  }
  // You can add more dynamic style changes here if needed
}

// ──────────────────────────────────────────────
// Data Persistence
// ──────────────────────────────────────────────
function loadData() {
  assignments = JSON.parse(localStorage.getItem("assignments") || "[]");
  mcqs        = JSON.parse(localStorage.getItem("mcqs") || "[]");

  // Seed demo data if empty
  if (assignments.length === 0) {
    assignments = [
      { id: Date.now()-2, title: "Algebra Basics", desc: "Pages 12–25", pdfUrl: SAMPLE_PDF },
      { id: Date.now()-1, title: "Water Cycle Diagram", desc: "Draw and label", pdfUrl: SAMPLE_PDF }
    ];
    saveData();
  }
  if (mcqs.length === 0) {
    mcqs = [
      { id: 1, question: "Capital of Kenya?", options: ["Mombasa","Nairobi","Kisumu","Eldoret"], correct: 1 },
      { id: 2, question: "2 + 2 × 3 = ?", options: ["8","12","10","6"], correct: 1 },
      { id: 3, question: "Jambo means?", options: ["Goodbye","Hello","Thank you","Please"], correct: 1 }
    ];
    saveData();
  }
}

function saveData() {
  localStorage.setItem("assignments", JSON.stringify(assignments));
  localStorage.setItem("mcqs", JSON.stringify(mcqs));
}

// ──────────────────────────────────────────────
// Assignments
// ──────────────────────────────────────────────
function renderAssignments() {
  const container = els.assignmentsList();
  container.innerHTML = "";

  assignments.forEach(ass => {
    const div = document.createElement("div");
    div.className = "card bg-white p-6 rounded-2xl shadow";
    div.innerHTML = `
      <h3 class="font-bold text-lg mb-2">${ass.title}</h3>
      <p class="text-gray-600 mb-4">${ass.desc || "No description"}</p>
      <button onclick="downloadPDF('${ass.pdfUrl || SAMPLE_PDF}', '${ass.title}')" 
        class="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
        📥 Download PDF
      </button>
      ${currentRole === "teacher" ? `<button onclick="deleteAssignment(${ass.id})" class="ml-3 text-red-600 text-sm">🗑 Delete</button>` : ''}
    `;
    container.appendChild(div);
  });
}

function downloadPDF(url, title) {
  const a = document.createElement("a");
  a.href = url;
  a.download = (title || "assignment") + ".pdf";
  a.click();
}

function addAssignment() {
  const title = document.getElementById("ass-title").value.trim();
  const desc  = document.getElementById("ass-desc").value.trim();
  let pdfUrl  = document.getElementById("ass-pdf").value.trim() || SAMPLE_PDF;

  if (!title) return alert("Please enter a title");

  assignments.unshift({ id: Date.now(), title, desc, pdfUrl });
  saveData();
  renderAssignments();

  // Clear form
  document.getElementById("ass-title").value = "";
  document.getElementById("ass-desc").value = "";
  document.getElementById("ass-pdf").value = "";
}

function deleteAssignment(id) {
  if (!confirm("Delete this assignment?")) return;
  assignments = assignments.filter(a => a.id !== id);
  saveData();
  renderAssignments();
}

// ──────────────────────────────────────────────
// MCQs / Quizzes
// ──────────────────────────────────────────────
function renderMCQs() {
  const container = els.mcqList();
  container.innerHTML = "";

  mcqs.forEach((q, idx) => {
    const div = document.createElement("div");
    div.className = "bg-white p-6 rounded-2xl shadow";
    div.innerHTML = `
      <p class="font-semibold text-lg mb-3">${idx+1}. ${q.question}</p>
      <ul class="list-disc pl-6 space-y-2 text-gray-700">
        ${q.options.map(opt => `<li>${opt}</li>`).join("")}
      </ul>
      ${currentRole === "teacher" ? `<button onclick="deleteMCQ(${q.id})" class="mt-4 text-red-600 text-sm">🗑 Delete</button>` : ''}
    `;
    container.appendChild(div);
  });

  els.startQuizBtn().classList.toggle("hidden", currentRole !== "learner" && currentRole !== "parent");
}

function addMCQ() {
  const question = document.getElementById("q-text").value.trim();
  const opts = [
    document.getElementById("opt0").value.trim(),
    document.getElementById("opt1").value.trim(),
    document.getElementById("opt2").value.trim(),
    document.getElementById("opt3").value.trim()
  ];
  const correct = parseInt(document.getElementById("correct-index").value);

  if (!question || !opts[0] || !opts[1]) {
    return alert("Please fill the question and at least first two options");
  }

  mcqs.unshift({ id: Date.now(), question, options: opts, correct });
  saveData();
  renderMCQs();

  // Clear form
  document.getElementById("q-text").value = "";
  document.getElementById("opt0").value = "";
  document.getElementById("opt1").value = "";
  document.getElementById("opt2").value = "";
  document.getElementById("opt3").value = "";
}

function deleteMCQ(id) {
  if (!confirm("Delete this question?")) return;
  mcqs = mcqs.filter(q => q.id !== id);
  saveData();
  renderMCQs();
}

// ──────────────────────────────────────────────
// Quiz Taking
// ──────────────────────────────────────────────
function startQuiz() {
  if (mcqs.length === 0) return alert("No questions available yet. Ask your teacher!");

  quizQuestions = [...mcqs];
  currentAnswers = new Array(quizQuestions.length).fill(null);

  const container = els.quizQuestions();
  container.innerHTML = "";

  quizQuestions.forEach((q, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p class="font-semibold text-xl mb-5">${i+1}. ${q.question}</p>
      <div class="grid grid-cols-1 gap-4">
        ${q.options.map((opt, idx) => `
          <label class="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
            <input type="radio" name="q${i}" value="${idx}" 
              onchange="currentAnswers[${i}] = ${idx}" class="w-5 h-5 accent-indigo-600"/>
            <span>${opt}</span>
          </label>
        `).join("")}
      </div>
    `;
    container.appendChild(div);
  });

  document.getElementById("quizzes-section").classList.add("hidden");
  document.getElementById("quiz-taking").classList.remove("hidden");
}

function submitQuiz() {
  if (currentAnswers.includes(null)) return alert("Please answer all questions!");

  let score = 0;
  let html = `<h3 class="text-4xl font-bold text-center mb-10">
    Your Score: <span class="text-green-600">${((currentAnswers.filter((a,i)=>a===quizQuestions[i].correct).length / quizQuestions.length)*100).toFixed(0)}%</span>
  </h3>`;

  quizQuestions.forEach((q, i) => {
    const correct = currentAnswers[i] === q.correct;
    if (correct) score++;
    html += `
      <div class="mb-8 p-6 rounded-2xl border ${correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
        <p class="font-medium mb-2">${i+1}. ${q.question}</p>
        <p>Your answer: <strong>${q.options[currentAnswers[i]]}</strong></p>
        <p class="${correct ? 'text-green-700' : 'text-red-700'}">
          Correct answer: <strong>${q.options[q.correct]}</strong>
        </p>
      </div>`;
  });

  els.quizQuestions().innerHTML = html + `
    <button onclick="backToMain()" class="block mx-auto mt-10 bg-indigo-600 text-white px-12 py-4 rounded-2xl text-lg font-bold hover:bg-indigo-700 transition">
      Back to Dashboard
    </button>`;
}

function cancelQuiz() {
  backToMain();
}

function backToMain() {
  document.getElementById("quiz-taking").classList.add("hidden");
  document.getElementById("quizzes-section").classList.remove("hidden");
}

// ──────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────
function switchTab(tabIndex) {
  document.querySelectorAll(".tab-button").forEach(el => el.classList.remove("active"));
  document.getElementById(`tab-${tabIndex}`).classList.add("active");

  document.getElementById("assignments-section").classList.toggle("hidden", tabIndex !== 0);
  document.getElementById("quizzes-section").classList.toggle("hidden", tabIndex !== 1);
  document.getElementById("quiz-taking").classList.add("hidden");
}

// ──────────────────────────────────────────────
// Role-based UI Visibility
// ──────────────────────────────────────────────
function updateUIVisibility() {
  const isTeacher = currentRole === "teacher";

  document.getElementById("teacher-assignments-form").classList.toggle("hidden", !isTeacher);
  document.getElementById("teacher-quiz-form").classList.toggle("hidden", !isTeacher);
  els.startQuizBtn().classList.toggle("hidden", currentRole !== "learner" && currentRole !== "parent");
}

// ──────────────────────────────────────────────
// Render Everything
// ──────────────────────────────────────────────
function renderAll() {
  renderAssignments();
  renderMCQs();
  updateUIVisibility();
}

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
window.onload = () => {
  loadData();

  if (!currentRole) {
    showWelcomeOverlay();
  } else {
    selectRole(currentRole);
  }

  renderAll();
};
