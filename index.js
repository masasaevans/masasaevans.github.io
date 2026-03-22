let currentRole = localStorage.getItem("masasaRole") || null;
let assignments = JSON.parse(localStorage.getItem("assignments") || "[]");
let teachers = JSON.parse(localStorage.getItem("teachers") || "[]");
let englishAnswers = new Array(10).fill(null);
let currentQuestions = [];

const STORY = {
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
};

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
  const input = btn.closest('div').querySelector('input');
  input.type = input.type === "password" ? "text" : "password";
  btn.textContent = input.type === "password" ? "👁️" : "🙈";
}

function validateTeacher() {
  const u = document.getElementById("teacher-username").value.trim();
  const p = document.getElementById("teacher-pass").value;
  if (teachers.some(t => t.username === u && t.password === p) || (u === "teacher" && p === "1234")) {
    selectRole("teacher");
  } else {
    alert("Wrong username or password");
  }
}

function resetRole() {
  if (confirm("Change role?")) {
    localStorage.removeItem("masasaRole");
    location.reload();
  }
}

function addAssignment() {
  const title = document.getElementById("ass-title").value.trim();
  if (!title) return alert("Title is required");
  assignments.unshift({ id: Date.now(), title });
  localStorage.setItem("assignments", JSON.stringify(assignments));
  renderAssignments();
}

function renderAssignments() {
  const list = document.getElementById("assignments-list");
  list.innerHTML = assignments.length ? assignments.map(a => `
    <div class="bg-white p-6 rounded-2xl shadow">
      <h3 class="font-bold text-lg">${a.title}</h3>
    </div>`).join("") : "<p class='text-gray-500'>No assignments yet</p>";
}

function renderDailyEnglish() {
  document.getElementById("english-title").textContent = STORY.title;
  document.getElementById("story-box").innerHTML = `<strong>Story:</strong><br>${STORY.story}`;
  currentQuestions = STORY.questions;
  englishAnswers.fill(null);
  document.getElementById("english-questions").innerHTML = STORY.questions.map((q,i) => `
    <div class="mb-6">
      <p class="font-semibold">${i+1}. ${q.q}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        ${q.o.map((opt,idx) => `<label class="flex items-center gap-3 p-3 border rounded-xl"><input type="radio" name="q${i}" onchange="englishAnswers[${i}]=${idx}"> ${opt}</label>`).join("")}
      </div>
    </div>`).join("");
}

function submitEnglishQuiz() {
  if (englishAnswers.includes(null)) return alert("Answer all 10 questions first!");
  let correct = 0;
  englishAnswers.forEach((a,i) => { if (a === currentQuestions[i].c) correct++; });
  const percent = Math.round(correct / 10 * 100);
  alert(`🎉 You scored ${percent}% !\n${correct}/10 correct`);
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
