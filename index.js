let currentRole = localStorage.getItem("masasaRole") || null;
let assignments = JSON.parse(localStorage.getItem("assignments") || "[]");
let teachers = JSON.parse(localStorage.getItem("teachers") || "[]");
let englishAnswers = new Array(10).fill(null);
let currentQuestions = [];

const STORY = {
  title: "The Singing Matatu",
  story: "Every Sunday morning in Eastlands, little Zawadi loved riding the number 19 matatu. One day the radio stopped working, but the passengers started singing old nyatiti songs together...",
  questions: [
    {q:"When does Zawadi ride?", o:["Sat","Sun","Mon","Fri"], c:1},
    {q:"What broke?", o:["Engine","Radio","Door","Seats"], c:1},
    {q:"What did passengers do?", o:["Argue","Sing","Sleep","Eat"], c:1},
    {q:"Instrument?", o:["Guitar","Nyatiti","Piano","Drum"], c:1},
    {q:"Deep voice?", o:["Zawadi","Driver","Child","Lady"], c:1},
    {q:"Reached?", o:["Village","Town","School","Market"], c:1},
    {q:"Learned?", o:["Music expensive","Music makes happy","Fast","Bad"], c:1},
    {q:"Songs?", o:["Pop","Nyatiti","School","None"], c:1},
    {q:"Feeling?", o:["Angry","Sad","Smiling","Tired"], c:2},
    {q:"Lesson?", o:["Never ride","Music joy","Radio","Boring"], c:1}
  ]
};

// Show temporary success banner
function showSuccess(message) {
  const banner = document.getElementById("success-banner");
  const text = document.getElementById("banner-text");
  text.textContent = message;
  banner.classList.remove("hidden");
  setTimeout(() => banner.classList.add("hidden"), 3000);
}

// === ROLE & LOGIN ===
function selectRole(role) {
  currentRole = role;
  localStorage.setItem("masasaRole", role);
  document.getElementById("role-overlay").classList.add("hidden");
  document.getElementById("main-header").classList.remove("hidden");
  document.getElementById("main-content").classList.remove("hidden");
  renderAll();
}

function showTeacherLogin() {
  document.getElementById("teacher-login").classList.remove("hidden");
  document.getElementById("login-error").classList.add("hidden");
}

function toggleVisibility(btn) {
  const input = btn.parentElement.querySelector("input");
  input.type = input.type === "password" ? "text" : "password";
  btn.textContent = input.type === "password" ? "👁️" : "🙈";
}

function validateTeacher() {
  const u = document.getElementById("teacher-username").value.trim();
  const p = document.getElementById("teacher-pass").value;
  const errorDiv = document.getElementById("login-error");

  if (teachers.some(t => t.username === u && t.password === p) || (u === "teacher" && p === "1234")) {
    selectRole("teacher");
  } else {
    errorDiv.textContent = "Wrong username or password";
    errorDiv.classList.remove("hidden");
  }
}

function resetRole() {
  if (confirm("Change role?")) {
    localStorage.removeItem("masasaRole");
    location.reload();
  }
}

// === ASSIGNMENTS ===
function addAssignment() {
  const title = document.getElementById("ass-title").value.trim();
  if (!title) return;
  assignments.unshift({ id: Date.now(), title });
  localStorage.setItem("assignments", JSON.stringify(assignments));
  renderAssignments();
  showSuccess("Assignment posted successfully!");
  document.getElementById("ass-title").value = "";
}

// === DAILY ENGLISH ===
function renderDailyEnglish() {
  document.getElementById("english-title").textContent = STORY.title;
  document.getElementById("story-box").innerHTML = `<strong>Story:</strong><br>${STORY.story}`;
  currentQuestions = STORY.questions;
  englishAnswers.fill(null);
  
  document.getElementById("questions-area").innerHTML = STORY.questions.map((q,i) => `
    <div class="mb-6">
      <p class="font-semibold">${i+1}. ${q.q}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${q.o.map((opt,idx) => `<label class="flex items-center gap-3 p-3 border rounded-xl"><input type="radio" name="q${i}" onchange="englishAnswers[${i}]=${idx}"> ${opt}</label>`).join("")}
      </div>
    </div>`).join("");
  
  document.getElementById("questions-area").classList.remove("hidden");
  document.getElementById("score-result").classList.add("hidden");
  document.getElementById("submit-btn").classList.remove("hidden");
}

function submitEnglishQuiz() {
  if (englishAnswers.includes(null)) return;
  
  let correct = 0;
  englishAnswers.forEach((a,i) => { if (a === currentQuestions[i].c) correct++; });
  const percent = Math.round(correct / 10 * 100);
  
  // Show score inside the same tab
  document.getElementById("questions-area").classList.add("hidden");
  document.getElementById("submit-btn").classList.add("hidden");
  const result = document.getElementById("score-result");
  result.classList.remove("hidden");
  document.getElementById("score-percent").textContent = percent + "%";
  document.getElementById("score-text").textContent = correct + "/10 correct";
}

function restartQuiz() {
  renderDailyEnglish();
}

function switchTab(n) {
  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + n).classList.add("active");
  document.getElementById("assignments-section").classList.toggle("hidden", n !== 0);
  document.getElementById("english-section").classList.toggle("hidden", n !== 2);
  if (n === 2) renderDailyEnglish();
}

function renderAll() {
  const isTeacher = currentRole === "teacher";
  document.getElementById("teacher-form").classList.toggle("hidden", !isTeacher);
  renderAssignments();
}

window.onload = () => {
  if (!currentRole) {
    document.getElementById("role-overlay").classList.remove("hidden");
  } else {
    document.getElementById("role-overlay").classList.add("hidden");
    document.getElementById("main-header").classList.remove("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    renderAll();
  }
};
