// ──────────────────────────────────────────────
// Configuration & Constants
// ──────────────────────────────────────────────
const SAMPLE_PDF = "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-pdf-file.pdf";

const DAILY_ENGLISH_CONTENT = {
  "2026-03-22": {
    title: "The Magic Matatu in Nairobi",
    story: "Every morning in Nairobi, little Kiano waited for the magic matatu. One day the matatu driver, Baba Juma, said, “Today we go on an adventure!” They drove past the tall buildings, the busy market, and the green park. Suddenly the matatu started singing Kenyan songs! All the passengers laughed and danced. At the end, Baba Juma gave Kiano a big mango and said, “Kindness makes every journey magical.” Kiano smiled and ran home to tell his mother the best story ever.",
    questions: [
      {q: "Where does the story mainly take place?", options: ["Mombasa","Nairobi","Kisumu","Nakuru"], correct: 1},
      {q: "What is the name of the young boy?", options: ["Juma","Kiano","Baba","Matatu"], correct: 1},
      {q: "Who is the driver of the matatu?", options: ["Kiano","Baba Juma","The mother","A passenger"], correct: 1},
      {q: "What surprising thing did the matatu do?", options: ["It flew","It sang songs","It stopped moving","It cried"], correct: 1},
      {q: "What gift did Baba Juma give to Kiano?", options: ["A book","Money","A big mango","A toy"], correct: 2},
      {q: "According to Baba Juma, what makes journeys magical?", options: ["Speed","Kindness","Money","Loud music"], correct: 1},
      {q: "How did Kiano feel when he got home?", options: ["Sad","Angry","Happy and excited","Sleepy"], correct: 2},
      {q: "What did Kiano want to do when he reached home?", options: ["Sleep","Tell his mother the story","Play football","Eat the mango"], correct: 1},
      {q: "What colour was the park they passed?", options: ["Blue","Red","Green","Yellow"], correct: 2},
      {q: "The main message of the story is about…", options: ["Adventure","Kindness","Magic matatus","Nairobi traffic"], correct: 1}
    ]
  },
  // Add more dates here as needed
};

// Weekday fallback (0=Sun ... 6=Sat)
const WEEKDAY_FALLBACK = [
  DAILY_ENGLISH_CONTENT["2026-03-22"],  // Sunday
  DAILY_ENGLISH_CONTENT["2026-03-22"],  // Monday (placeholder - replace with real content)
  DAILY_ENGLISH_CONTENT["2026-03-22"],  // Tuesday
  DAILY_ENGLISH_CONTENT["2026-03-22"],  // Wednesday
  DAILY_ENGLISH_CONTENT["2026-03-22"],  // Thursday
  DAILY_ENGLISH_CONTENT["2026-03-22"],  // Friday
  DAILY_ENGLISH_CONTENT["2026-03-22"]   // Saturday
];

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────
let currentRole = localStorage.getItem("masasaRole") || null;
let assignments  = [];
let mcqs         = [];
let teachers     = JSON.parse(localStorage.getItem("teachers") || "[]");
let englishAnswers = [];
let currentEnglishContent = null;
let currentEnglishQuestions = [];
let quizQuestions = [];
let currentAnswers = [];

// ──────────────────────────────────────────────
// DOM Helpers
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
};

// ──────────────────────────────────────────────
// Role & Theme
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
  document.getElementById("teacher-username").value = "";
  document.getElementById("teacher-pass").value = "";
}

function validateTeacher() {
  const username = document.getElementById("teacher-username").value.trim();
  const pass = document.getElementById("teacher-pass").value;
  const found = teachers.find(t => t.username === username && t.password === pass);
  if (found) {
    selectRole("teacher");
  } else {
    alert("Wrong username or password!\nAsk Admin for correct credentials.");
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
  document.body.classList.toggle("learner-theme", role === "learner" || role === "parent");
}

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────
function loadData() {
  assignments = JSON.parse(localStorage.getItem("assignments") || "[]");
  mcqs = JSON.parse(localStorage.getItem("mcqs") || "[]");

  if (assignments.length === 0) {
    assignments = [
      { id: Date.now()-2, title: "Algebra Basics", desc: "Pages 12–25", pdfUrl: SAMPLE_PDF },
      { id: Date.now()-1, title: "Water Cycle Diagram", desc: "Draw and label", pdfUrl: SAMPLE_PDF }
    ];
  }
  if (mcqs.length === 0) {
    mcqs = [
      { id: 1, question: "Capital of Kenya?", options: ["Mombasa","Nairobi","Kisumu","Eldoret"], correct: 1 },
      { id: 2, question: "2 + 2 × 3 = ?", options: ["8","12","10","6"], correct: 1 }
    ];
  }
}

function saveData() {
  localStorage.setItem("assignments", JSON.stringify(assignments));
  localStorage.setItem("mcqs", JSON.stringify(mcqs));
  localStorage.setItem("teachers", JSON.stringify(teachers));
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
      <button onclick="downloadPDF('${ass.pdfUrl || SAMPLE_PDF}', '${ass.title.replace(/"/g,'&quot;')}')" 
        class="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-emerald-700">
        📥 Download PDF
      </button>
      ${currentRole === "teacher" ? `<button onclick="deleteAssignment(${ass.id})" class="ml-3 text-red-600 text-sm">🗑</button>` : ''}
    `;
    container.appendChild(div);
  });
}

function downloadPDF(url, title) {
  const a = document.createElement("a");
  a.href = url;
  a.download = (title || "assignment") + ".pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function addAssignment() {
  const title = document.getElementById("ass-title").value.trim();
  const desc = document.getElementById("ass-desc").value.trim();
  const pdfUrl = document.getElementById("ass-pdf").value.trim() || SAMPLE_PDF;

  if (!title) return alert("Title is required");

  assignments.unshift({ id: Date.now(), title, desc, pdfUrl });
  saveData();
  renderAssignments();
  document.getElementById("ass-title").value = "";
  document.getElementById("ass-desc").value = "";
  document.getElementById("ass-pdf").value = "";
}

function deleteAssignment(id) {
  if (!confirm("Delete assignment?")) return;
  assignments = assignments.filter(a => a.id !== id);
  saveData();
  renderAssignments();
}

// ──────────────────────────────────────────────
// MCQs
// ──────────────────────────────────────────────
function renderMCQs() {
  const container = els.mcqList();
  container.innerHTML = "";

  mcqs.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "bg-white p-6 rounded-2xl shadow";
    div.innerHTML = `
      <p class="font-semibold text-lg mb-3">${i+1}. ${q.question}</p>
      <ul class="list-disc pl-6 space-y-2 text-gray-700">
        ${q.options.map(opt => `<li>${opt}</li>`).join("")}
      </ul>
      ${currentRole === "teacher" ? `<button onclick="deleteMCQ(${q.id})" class="mt-4 text-red-600 text-sm">🗑 Delete</button>` : ''}
    `;
    container.appendChild(div);
  });

  els.startQuizBtn().classList.toggle("hidden", !["learner","parent"].includes(currentRole));
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

  if (!question || !opts[0] || !opts[1]) return alert("Question and first two options required");

  mcqs.unshift({ id: Date.now(), question, options: opts, correct });
  saveData();
  renderMCQs();
  document.getElementById("q-text").value = "";
  ["opt0","opt1","opt2","opt3"].forEach(id => document.getElementById(id).value = "");
}

function deleteMCQ(id) {
  if (!confirm("Delete question?")) return;
  mcqs = mcqs.filter(q => q.id !== id);
  saveData();
  renderMCQs();
}

// ──────────────────────────────────────────────
// Quiz Taking (MCQs)
// ──────────────────────────────────────────────
function startQuiz() {
  if (mcqs.length === 0) return alert("No questions yet — ask your teacher!");

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
          <label class="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50">
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
  if (currentAnswers.includes(null)) return alert("Answer all questions!");

  const correctCount = currentAnswers.reduce((sum, ans, i) => sum + (ans === quizQuestions[i].correct ? 1 : 0), 0);
  const percent = Math.round((correctCount / quizQuestions.length) * 100);

  let html = `
    <div class="text-center py-12">
      <div class="text-6xl mb-6">${percent >= 80 ? "🎉🥳🔥" : percent >= 50 ? "👏😊" : "📚💪"}</div>
      <h3 class="text-5xl font-bold ${percent >= 70 ? 'text-green-600' : 'text-orange-600'} mb-4">${percent}%</h3>
      <p class="text-xl mb-8">(${correctCount} correct out of ${quizQuestions.length})</p>
      <button onclick="backToMain()" class="bg-indigo-600 text-white px-12 py-4 rounded-2xl text-lg">Back to Dashboard</button>
    </div>`;

  els.quizQuestions().innerHTML = html;
}

function cancelQuiz() { backToMain(); }
function backToMain() {
  document.getElementById("quiz-taking").classList.add("hidden");
  document.getElementById("quizzes-section").classList.remove("hidden");
}

// ──────────────────────────────────────────────
// Daily English
// ──────────────────────────────────────────────
function renderEnglishQuestions() {
  const today = new Date().toISOString().split('T')[0];
  const weekday = new Date().getDay();

  let content = DAILY_ENGLISH_CONTENT[today] || WEEKDAY_FALLBACK[weekday] || DAILY_ENGLISH_CONTENT["2026-03-22"];

  currentEnglishContent = content;
  currentEnglishQuestions = content.questions;

  // Update title
  document.querySelector("#english-section h2").textContent = `Daily English: ${content.title}`;

  // Update story
  document.querySelector("#english-section .bg-amber-50").innerHTML = `<strong>Story:</strong> ${content.story}`;

  englishAnswers = new Array(10).fill(null);
  const container = document.getElementById("english-questions");
  container.innerHTML = "";

  content.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p class="font-semibold mb-4">${i+1}. ${q.q}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${q.options.map((opt, idx) => `
          <label class="flex items-center gap-3 p-4 border border-gray-300 rounded-2xl cursor-pointer hover:bg-yellow-50">
            <input type="radio" name="eng${i}" value="${idx}" 
              onchange="englishAnswers[${i}] = ${idx}" class="w-5 h-5 accent-green-600">
            <span class="text-gray-800">${opt}</span>
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

  if (!currentEnglishQuestions?.length) {
    alert("No questions loaded. Try refreshing the tab.");
    return;
  }

  const correctCount = englishAnswers.reduce((sum, ans, i) => 
    sum + (ans === currentEnglishQuestions[i].correct ? 1 : 0), 0);

  const percent = Math.round((correctCount / 10) * 100);

  let emoji = "📚💪";
  let message = "Good effort! Come back tomorrow for a new story.";

  if (percent >= 90) {
    emoji = "🎉🥳🔥✨";
    message = "Outstanding! You're a comprehension superstar!";
  } else if (percent >= 70) {
    emoji = "👏😊🌟";
    message = "Well done! Keep up the great reading!";
  } else if (percent >= 50) {
    emoji = "👍🙌";
    message = "Solid effort! A little more practice and you'll shine.";
  }

  const resultHTML = `
    <div class="text-center py-12 px-4">
      <div class="text-6xl mb-6">${emoji}</div>
      <h3 class="text-5xl font-bold ${percent >= 70 ? 'text-green-600' : 'text-orange-600'} mb-4">${percent}%</h3>
      <p class="text-xl font-medium mb-4">${message}</p>
      <p class="text-gray-600 mb-8">(${correctCount} correct out of 10)</p>
      <button onclick="renderEnglishQuestions()" 
        class="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-lg font-medium hover:bg-indigo-700">
        Read Story Again
      </button>
    </div>`;

  document.getElementById("english-questions").innerHTML = resultHTML;

  setTimeout(() => {
    alert(`${emoji}\n\nYour Score: ${percent}% (${correctCount}/10)\n\n${message}`);
  }, 300);
}

// ──────────────────────────────────────────────
// Tabs Navigation
// ──────────────────────────────────────────────
function switchTab(tabIndex) {
  document.querySelectorAll(".tab-button").forEach(el => el.classList.remove("active"));
  const tab = document.getElementById(`tab-${tabIndex}`);
  if (tab) tab.classList.add("active");

  ["assignments-section", "quizzes-section", "english-section", "quiz-taking"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  if (tabIndex === 0) document.getElementById("assignments-section")?.classList.remove("hidden");
  if (tabIndex === 1) document.getElementById("quizzes-section")?.classList.remove("hidden");
  if (tabIndex === 2) {
    if (["learner","parent"].includes(currentRole)) {
      document.getElementById("english-section")?.classList.remove("hidden");
      renderEnglishQuestions();
    } else {
      alert("Daily English is for Learners & Parents only");
      switchTab(0);
    }
  }
}

// ──────────────────────────────────────────────
// Admin Panel
// ──────────────────────────────────────────────
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
    alert("Incorrect admin credentials");
  }
}

function renderTeacherList() {
  const container = document.getElementById("teacher-list");
  container.innerHTML = teachers.length 
    ? teachers.map(t => `
        <div class="flex justify-between bg-gray-100 p-3 rounded-xl mb-2 text-sm">
          <span>${t.username}</span>
          <span class="text-gray-500">Pass: ${t.password}</span>
        </div>`).join("")
    : "<p class='text-gray-400 italic'>No teachers added yet</p>";
}

function addNewTeacher() {
  const username = document.getElementById("new-teacher-user").value.trim();
  const password = document.getElementById("new-teacher-pass").value.trim();
  if (!username || !password) return alert("Both username and password required");

  if (teachers.some(t => t.username === username)) {
    return alert("Username already exists");
  }

  teachers.push({ username, password });
  saveData();
  renderTeacherList();
  alert(`Teacher "${username}" added!\nPassword: ${password}\nGive these to your teacher.`);
  document.getElementById("new-teacher-user").value = "";
  document.getElementById("new-teacher-pass").value = "";
}

function closeAdminModal() {
  document.getElementById("admin-modal").classList.add("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
}

// ──────────────────────────────────────────────
// UI Visibility by Role
// ──────────────────────────────────────────────
function updateUIVisibility() {
  const isTeacher = currentRole === "teacher";
  document.getElementById("teacher-assignments-form")?.classList.toggle("hidden", !isTeacher);
  document.getElementById("teacher-quiz-form")?.classList.toggle("hidden", !isTeacher);
  els.startQuizBtn()?.classList.toggle("hidden", !["learner","parent"].includes(currentRole));
}

// ──────────────────────────────────────────────
// Render All
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
