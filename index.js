let role = "student";
let assignments = [];
let mcqs = [];
let currentAnswers = [];

const samplePDF = "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-pdf-file.pdf";

// Tailwind script already loaded
function initTailwind() {
  // Already works via CDN
}

// Load from localStorage or preload demo data
function loadData() {
  const savedAss = localStorage.getItem("assignments");
  const savedMCQ = localStorage.getItem("mcqs");

  if (savedAss) assignments = JSON.parse(savedAss);
  else {
    assignments = [
      { id: 1, title: "Mathematics Homework 1", desc: "Complete exercises on algebra", pdfUrl: samplePDF },
      { id: 2, title: "Science Practical Report", desc: "Write lab report on water cycle", pdfUrl: samplePDF }
    ];
    saveData();
  }

  if (savedMCQ) mcqs = JSON.parse(savedMCQ);
  else {
    mcqs = [
      { id: 1, question: "What is the capital of Kenya?", options: ["Mombasa", "Nairobi", "Kisumu", "Nakuru"], correct: 1 },
      { id: 2, question: "2 + 2 = ?", options: ["3", "4", "5", "6"], correct: 1 },
      { id: 3, question: "Jambo means?", options: ["Goodbye", "Thank you", "Hello", "Sorry"], correct: 2 }
    ];
    saveData();
  }
}

function saveData() {
  localStorage.setItem("assignments", JSON.stringify(assignments));
  localStorage.setItem("mcqs", JSON.stringify(mcqs));
}

function switchRole(newRole) {
  role = newRole;
  document.getElementById("btn-teacher").classList.toggle("bg-white", newRole === "teacher");
  document.getElementById("btn-teacher").classList.toggle("text-indigo-700", newRole === "teacher");
  document.getElementById("btn-student").classList.toggle("bg-white", newRole === "student");
  document.getElementById("btn-student").classList.toggle("text-indigo-700", newRole === "student");

  document.getElementById("teacher-assignments-form").classList.toggle("hidden", newRole !== "teacher");
  document.getElementById("teacher-quiz-form").classList.toggle("hidden", newRole !== "teacher");
  document.getElementById("start-quiz-btn").classList.toggle("hidden", newRole !== "student");

  renderAll();
}

function switchTab(tab) {
  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");

  document.getElementById("assignments-section").classList.add("hidden");
  document.getElementById("quizzes-section").classList.add("hidden");
  document.getElementById("quiz-taking").classList.add("hidden");

  if (tab === 0) document.getElementById("assignments-section").classList.remove("hidden");
  else document.getElementById("quizzes-section").classList.remove("hidden");
}

function renderAssignments() {
  const container = document.getElementById("assignments-list");
  container.innerHTML = "";

  assignments.forEach(ass => {
    const div = document.createElement("div");
    div.className = "card bg-white p-6 rounded-2xl shadow";
    div.innerHTML = `
      <h3 class="font-semibold text-lg">${ass.title}</h3>
      <p class="text-gray-600 mt-2">${ass.desc}</p>
      <button onclick="downloadPDF(${ass.id})" 
        class="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-medium">
        📥 Download PDF
      </button>
      ${role === "teacher" ? `<button onclick="deleteAssignment(${ass.id})" class="ml-2 text-red-500">🗑</button>` : ''}
    `;
    container.appendChild(div);
  });
}

function downloadPDF(id) {
  const ass = assignments.find(a => a.id === id);
  const link = document.createElement("a");
  link.href = ass.pdfUrl || samplePDF;
  link.download = ass.title.replace(/ /g, "_") + ".pdf";
  link.click();
}

function addAssignment() {
  const title = document.getElementById("ass-title").value.trim();
  const desc = document.getElementById("ass-desc").value.trim();
  let pdfUrl = document.getElementById("ass-pdf").value.trim();

  if (!title) return alert("Title required");
  if (!pdfUrl) pdfUrl = samplePDF;

  assignments.unshift({
    id: Date.now(),
    title,
    desc: desc || "No description",
    pdfUrl
  });
  saveData();
  renderAssignments();
  document.getElementById("ass-title").value = "";
  document.getElementById("ass-desc").value = "";
}

function deleteAssignment(id) {
  if (confirm("Delete this assignment?")) {
    assignments = assignments.filter(a => a.id !== id);
    saveData();
    renderAssignments();
  }
}

function renderMCQs() {
  const container = document.getElementById("mcq-list");
  container.innerHTML = "";

  mcqs.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "bg-white p-6 rounded-2xl shadow mb-4";
    div.innerHTML = `
      <p class="font-medium">${i+1}. ${q.question}</p>
      <ul class="mt-3 space-y-2">
        ${q.options.map((opt, idx) => `<li class="pl-4">• ${opt}</li>`).join("")}
      </ul>
      ${role === "teacher" ? `<button onclick="deleteMCQ(${q.id})" class="mt-4 text-red-500 text-sm">Delete</button>` : ''}
    `;
    container.appendChild(div);
  });
}

function addMCQ() {
  const question = document.getElementById("q-text").value.trim();
  const opt0 = document.getElementById("opt0").value.trim();
  const opt1 = document.getElementById("opt1").value.trim();
  const opt2 = document.getElementById("opt2").value.trim();
  const opt3 = document.getElementById("opt3").value.trim();
  const correct = parseInt(document.getElementById("correct-index").value);

  if (!question || !opt0 || !opt1) return alert("Fill question and at least first two options");

  mcqs.unshift({
    id: Date.now(),
    question,
    options: [opt0, opt1, opt2 || "", opt3 || ""],
    correct
  });
  saveData();
  renderMCQs();
  // clear form
  document.getElementById("q-text").value = "";
  document.getElementById("opt0").value = "";
  document.getElementById("opt1").value = "";
  document.getElementById("opt2").value = "";
  document.getElementById("opt3").value = "";
}

function deleteMCQ(id) {
  if (confirm("Delete this question?")) {
    mcqs = mcqs.filter(q => q.id !== id);
    saveData();
    renderMCQs();
  }
}

let quizQuestions = [];
function startQuiz() {
  if (mcqs.length === 0) return alert("Teacher has not added any questions yet!");

  quizQuestions = [...mcqs];
  currentAnswers = new Array(quizQuestions.length).fill(null);

  const container = document.getElementById("quiz-questions");
  container.innerHTML = "";

  quizQuestions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "mb-10";
    div.innerHTML = `
      <p class="font-semibold mb-4">${i+1}. ${q.question}</p>
      <div class="grid grid-cols-1 gap-3">
        ${q.options.map((opt, idx) => `
          <label class="option-label flex items-center gap-3 p-4 border rounded-2xl cursor-pointer">
            <input type="radio" name="q${i}" value="${idx}" onchange="currentAnswers[${i}] = ${idx}"
              class="w-5 h-5 accent-indigo-600">
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

  let score = 0;
  let html = `<h3 class="text-3xl font-bold text-center mb-8">Your Score: <span class="text-green-600">${Math.round((currentAnswers.filter((a,i) => a === quizQuestions[i].correct).length / quizQuestions.length) * 100)}%</span></h3>`;

  quizQuestions.forEach((q, i) => {
    const isCorrect = currentAnswers[i] === q.correct;
    if (isCorrect) score++;
    html += `
      <div class="mb-8 p-6 rounded-2xl ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border">
        <p class="font-medium">${i+1}. ${q.question}</p>
        <p class="mt-2">Your answer: <strong>${q.options[currentAnswers[i]]}</strong></p>
        <p class="${isCorrect ? 'text-green-600' : 'text-red-600'}">Correct: <strong>${q.options[q.correct]}</strong></p>
      </div>`;
  });

  const container = document.getElementById("quiz-questions");
  container.innerHTML = html + `<button onclick="backToMain()" class="block mx-auto mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl">Back to Dashboard</button>`;
}

function cancelQuiz() {
  backToMain();
}

function backToMain() {
  document.getElementById("quiz-taking").classList.add("hidden");
  document.getElementById("quizzes-section").classList.remove("hidden");
}

function renderAll() {
  renderAssignments();
  renderMCQs();
}

// Initialize
window.onload = () => {
  loadData();
  switchRole("student"); // default
  switchTab(0);
  renderAll();
};
