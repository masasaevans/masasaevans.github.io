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
let teachers = JSON.parse(localStorage.getItem("teachers") || "[]"); // [{username, password}, ...]
let englishAnswers = [];
// Daily stories & questions (expand this object over time)
// Key = 'YYYY-MM-DD' or weekday name fallback
const DAILY_ENGLISH_CONTENT = {
  "2026-03-22": {  // Sunday example - you already have this story
    title: "The Magic Matatu in Nairobi",
    story: "Every morning in Nairobi, little Kiano waited for the magic matatu. One day the matatu driver, Baba Juma, said, “Today we go on an adventure!” They drove past the tall buildings, the busy market, and the green park. Suddenly the matatu started singing Kenyan songs! All the passengers laughed and danced. At the end, Baba Juma gave Kiano a big mango and said, “Kindness makes every journey magical.” Kiano smiled and ran home to tell his mother the best story ever.",
    questions: [
      {q: "Where does the story mainly take place?",          options: ["Mombasa","Nairobi","Kisumu","Nakuru"], correct: 1},
      {q: "What is the name of the young boy?",               options: ["Juma","Kiano","Baba","Matatu"], correct: 1},
      {q: "Who is the driver of the matatu?",                 options: ["Kiano","Baba Juma","The mother","A passenger"], correct: 1},
      {q: "What surprising thing did the matatu do?",         options: ["It flew","It sang songs","It stopped moving","It cried"], correct: 1},
      {q: "What gift did Baba Juma give to Kiano?",           options: ["A book","Money","A big mango","A toy"], correct: 2},
      {q: "According to Baba Juma, what makes journeys magical?", options: ["Speed","Kindness","Money","Loud music"], correct: 1},
      {q: "How did Kiano feel when he got home?",             options: ["Sad","Angry","Happy and excited","Sleepy"], correct: 2},
      {q: "What did Kiano want to do when he reached home?",  options: ["Sleep","Tell his mother the story","Play football","Eat the mango"], correct: 1},
      {q: "What colour was the park they passed?",            options: ["Blue","Red","Green","Yellow"], correct: 2},
      {q: "The main message of the story is about…",          options: ["Adventure","Kindness","Magic matatus","Nairobi traffic"], correct: 1}
    ]
  },
  "2026-03-23": {  // Monday example - new story
    title: "Amani and the Lost Lion Cub",
    story: "In the Maasai Mara, young Amani found a tiny lion cub crying under an acacia tree. Its mother was nowhere. Amani carried water in her calabash and shared her ugali. She sang a soft Luo lullaby. Hours later, the lioness appeared. Instead of roaring, she gently rubbed against Amani as thanks. From that day, Amani became known as 'Lion Friend' in her village.",
    questions: [
      {q: "Where did Amani find the lion cub?", options: ["Nairobi","Maasai Mara","Kibera","Coast"], correct: 1},
      {q: "What did Amani share with the cub?", options: ["Her phone","Water and ugali","Toys","Money"], correct: 1},
      {q: "What song did Amani sing?",          options: ["A pop song","A Luo lullaby","A school anthem","Nothing"], correct: 1},
      {q: "How did the lioness react when she returned?", options: ["Attacked Amani","Rubbed against her gently","Ran away","Roared loudly"], correct: 1},
      {q: "What nickname did Amani get?",       options: ["Fast Runner","Lion Friend","Water Girl","Singer"], correct: 1},
      // ... add 5 more similar questions ...
      {q: "Question 6 placeholder", options: ["A","B","C","D"], correct: 0},
      {q: "Question 7 placeholder", options: ["A","B","C","D"], correct: 0},
      {q: "Question 8 placeholder", options: ["A","B","C","D"], correct: 0},
      {q: "Question 9 placeholder", options: ["A","B","C","D"], correct: 0},
      {q: "Question 10 placeholder",options: ["A","B","C","D"], correct: 0}
    ]
  },
  // Add more dates or use weekday fallback below
};

// Fallback if date not found → cycle by weekday
const WEEKDAY_FALLBACK = [
  // Sunday
  DAILY_ENGLISH_CONTENT["2026-03-22"],
  // Monday (use the March 23 example or create new)
  DAILY_ENGLISH_CONTENT["2026-03-23"],
  // Tuesday → add your own story/questions
  { title: "Tuesday Story", story: "...", questions: [/*10 q*/] },
  // ... Wednesday to Saturday
];
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
  const activeTab = document.getElementById(`tab-${tabIndex}`);
  if (activeTab) activeTab.classList.add("active");

  document.getElementById("assignments-section").classList.add("hidden");
  document.getElementById("quizzes-section").classList.add("hidden");
  document.getElementById("english-section").classList.add("hidden");
  document.getElementById("quiz-taking").classList.add("hidden");

  if (tabIndex === 0) document.getElementById("assignments-section").classList.remove("hidden");
  else if (tabIndex === 1) document.getElementById("quizzes-section").classList.remove("hidden");
  else if (tabIndex === 2) {
    if (currentRole === "learner" || currentRole === "parent") {
      document.getElementById("english-section").classList.remove("hidden");
      renderEnglishQuestions();
    } else {
      alert("Daily English is for Learners & Parents only");
      switchTab(0);
    }
  }
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
// ================== ADMIN & TEACHER LOGIN (additional) ==================
function showAdminPanel() {
  document.getElementById("admin-modal").classList.remove("hidden");
}

function loginAdmin() {
  const user = document.getElementById("admin-user").value.trim();
  const pass = document.getElementById("admin-pass").value;
  if (user === "admin" && pass === "MasasaAdmin2026!") {
    document.getElementById("admin-panel").classList.remove("hidden");
    renderTeacherList();
  } else {
    alert("Wrong admin credentials!");
  }
}

function renderTeacherList() {
  const container = document.getElementById("teacher-list");
  container.innerHTML = teachers.length ? teachers.map(t => 
    `<div class="flex justify-between bg-gray-100 p-3 rounded-xl mb-2">
      <span>${t.username}</span>
      <span class="text-xs text-gray-500">Pass: ${t.password}</span>
    </div>`).join("") : "<p class='text-gray-400'>No teachers yet</p>";
}

function addNewTeacher() {
  const username = document.getElementById("new-teacher-user").value.trim();
  const password = document.getElementById("new-teacher-pass").value.trim();
  if (!username || !password) return alert("Fill both fields");
  teachers.push({username, password});
  localStorage.setItem("teachers", JSON.stringify(teachers));
  renderTeacherList();
  alert(`Teacher ${username} added! Give them this password: ${password}`);
}

function closeAdminModal() {
  document.getElementById("admin-modal").classList.add("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
}

// Update teacher login (replace the old validateTeacher function)
function validateTeacher() {
  const username = document.getElementById("teacher-email").value.trim(); // reuse field as username
  const pass = document.getElementById("teacher-pass").value;
  const found = teachers.find(t => t.username === username && t.password === pass);
  if (found) {
    selectRole("teacher");
    hideTeacherLogin();
  } else {
    alert("Wrong username or password!\nAsk Admin to give you the correct ones.");
  }
}

// ================== DAILY ENGLISH (10 questions) ==================
function renderEnglishQuestions() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let content = DAILY_ENGLISH_CONTENT[today];

  if (!content) {
    // Fallback to weekday (0=Sunday, 1=Monday, ...)
    const weekday = new Date().getDay();
    content = WEEKDAY_FALLBACK[weekday] || DAILY_ENGLISH_CONTENT["2026-03-22"]; // default
  }

  // Update title & story
  document.querySelector("#english-section h2").textContent = "Daily English: " + content.title;
  document.querySelector("#english-section .bg-amber-50").innerHTML = `<strong>Story:</strong> ${content.story}`;

  englishAnswers = new Array(10).fill(null);
  const container = document.getElementById("english-questions");
  container.innerHTML = "";

  content.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p class="font-semibold mb-4">${i+1}. ${q.q}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${q.options.map((opt, idx) => `
          <label class="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-yellow-50 transition">
            <input type="radio" name="eng${i}" value="${idx}" 
              onchange="englishAnswers[${i}] = ${idx}" class="w-5 h-5 accent-green-500">
            <span>${opt}</span>
          </label>
        `).join("")}
      </div>
    `;
    container.appendChild(div);
  });
}

function submitEnglishQuiz() {
  if (englishAnswers.includes(null)) {
    alert("Please answer all 10 questions first! 🌟");
    return;
  }

  const correctCount = englishAnswers.filter((ans, i) => ans === DAILY_ENGLISH_CONTENT[Object.keys(DAILY_ENGLISH_CONTENT)[0]].questions[i]?.correct || false).length;
  // Note: the line above is simplified — in real use match with current content.questions[i].correct
  // Better version:
  // You need to store current content globally or re-fetch — for simplicity assume fixed index or save currentQuestions

  // Improved (add this variable at top of file):
  // let currentEnglishQuestions = [];

  // Then in renderEnglishQuestions():
  // currentEnglishQuestions = content.questions;

  // Then here:
  const score = englishAnswers.filter((ans, i) => ans === currentEnglishQuestions[i].correct).length;
  const percent = Math.round((score / 10) * 100);

  // Congratulatory popup
  const emoji = percent >= 80 ? "🎉🥳🔥" : percent >= 50 ? "👏😊" : "📚💪";
  const message = percent === 100 ? "Perfect! You're a comprehension star! 🌟" 
                 : percent >= 80 ? "Excellent job! Keep shining! ✨" 
                 : percent >= 50 ? "Good effort! You're getting better every day! 👍" 
                 : "Great try! Read the story again and try tomorrow! 📖";

  // Simple alert popup (you can replace with custom modal later)
  setTimeout(() => {
    alert(`${emoji}\n\nYour Score: ${percent}% (${score}/10)\n\n${message}`);
  }, 300);

  // Optional: show inline too
  document.getElementById("english-questions").innerHTML = `
    <div class="text-center py-12">
      <div class="text-5xl mb-4">${emoji}</div>
      <h3 class="text-4xl font-bold text-green-600 mb-4">${percent}%</h3>
      <p class="text-xl mb-6">${message}</p>
      <button onclick="renderEnglishQuestions()" class="bg-blue-600 text-white px-10 py-4 rounded-2xl text-lg">
        Try Again / Next Day
      </button>
    </div>`;
}

// Helper
function backToEnglishTab() {
  renderEnglishQuestions();
}
window.onload = () => {
  loadData();

  if (!currentRole) {
    showWelcomeOverlay();
  } else {
    selectRole(currentRole);
    // Inside your existing window.onload → after selectRole(currentRole);
switchTab(0);   // ← already there, just keep
  }

  renderAll();
};
