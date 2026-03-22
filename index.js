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

// === POPUP SYSTEM (no more alerts) ===
function showPopup(message, type = "success") {
  const popup = document.getElementById("popup");
  const icon = document.getElementById("popup-icon");
  const title = document.getElementById("popup-title");
  const msg = document.getElementById("popup-message");

  if (type === "success") {
    icon.textContent = "🎉";
    title.textContent = "Success!";
    title.className = "text-2xl font-bold mb-2 text-emerald-600";
  } else {
    icon.textContent = "⚠️";
    title.textContent = "Oops!";
    title.className = "text-2xl font-bold mb-2 text-red-600";
  }

  msg.textContent = message;
  popup.classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
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
}

function toggleVisibility(btn) {
  const input = btn.parentElement.querySelector("input");
  input.type = input.type === "password" ? "text" : "password";
  btn.textContent = input.type === "password" ? "👁️" : "🙈";
}

function validateTeacher() {
  const u = document.getElementById("teacher-username").value.trim();
  const p = document.getElementById("teacher-pass").value;
  if (teachers.some(t => t.username === u && t.password === p) || (u === "teacher" && p === "1234")) {
    selectRole("teacher");
  } else {
    showPopup("Wrong username or password", "error");
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
  if (!title) {
    showPopup("Title is required", "error");
    return;
  }
  assignments.unshift({ id: Date.now(), title });
  localStorage.setItem("assignments", JSON.stringify(assignments));
  renderAssignments();
  document.getElementById("ass-title").value = "";
  document.getElementById("ass-desc").value = "";
}

function renderAssignments() {
  const container = document.getElementById("assignments-list");
  container.innerHTML = assignments.length 
    ? assignments.map(a => `<div class="bg-white p-5 rounded-2xl shadow"><h3 class="font-bold">${a.title}</h3></div>`).join("")
    : "<p class='text-gray-500 text-center py-8'>No assignments yet</p>";
}

// === DAILY ENGLISH ===
function renderDailyEnglish() {
  document.getElementById("english-title").textContent = STORY.title;
  document.getElementById("story-box").innerHTML = `<strong>Story:</strong><br>${STORY.story}`;
  currentQuestions = STORY.questions;
  englishAnswers.fill(null);
  document.getElementById("english-questions").innerHTML = STORY.questions.map((q,i) => `
    <div class="mb-6">
      <p class="font-semibold">${i+1}. ${q.q}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${q.o.map((opt,idx) => `<label class="flex items-center gap-3 p-3 border rounded-xl"><input type="radio" name="q${i}" onchange="englishAnswers[${i}]=${idx}"> ${opt}</label>`).join("")}
      </div>
    </div>`).join("");
}

function submitEnglishQuiz() {
  if (englishAnswers.includes(null)) {
    showPopup("Please answer all 10 questions", "error");
    return;
  }
  let correct = 0;
  englishAnswers.forEach((a,i) => { if (a === currentQuestions[i].c) correct++; });
  const percent = Math.round(correct / 10 * 100);
  showPopup(`You scored ${percent}% ! 🎉`, "success");
}

// === TABS ===
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

// === INIT ===
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
