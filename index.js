// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "Miritini123";
const SAMPLE_PDF = "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-pdf-file.pdf";

// 7 different stories – one per weekday (0=Sunday … 6=Saturday)
const WEEKLY_ENGLISH_STORIES = [
  // 0 Sunday
  {
    title: "The Singing Matatu",
    story: "Every Sunday morning in Eastlands, little Zawadi loved riding the number 19 matatu. One day the radio stopped working, but the passengers started singing old nyatiti songs together. The driver joined in with a deep voice. By the time they reached town, everyone was smiling. Zawadi learned that music can turn any journey into a happy one.",
    questions: [
      {q:"When does Zawadi usually ride the matatu?",o:["Saturday","Sunday","Monday","Friday"],c:1},
      {q:"What broke in the matatu?",o:["Engine","Radio","Door","Seats"],c:1},
      {q:"What did passengers start doing?",o:["Arguing","Singing","Sleeping","Eating"],c:1},
      {q:"Which instrument is mentioned?",o:["Guitar","Nyatiti","Piano","Drum"],c:1},
      {q:"Who had a deep voice?",o:["Zawadi","Driver","Child","Old lady"],c:1},
      {q:"Where did they reach?",o:["Village","Town","School","Market"],c:1},
      {q:"What did Zawadi learn?",o:["Music is expensive","Music makes journeys happy","Matatus are fast","Singing is bad"],c:1},
      {q:"What kind of songs?",o:["New pop","Old nyatiti","School","None"],c:1},
      {q:"How did people feel at the end?",o:["Angry","Sad","Smiling","Tired"],c:2},
      {q:"Main lesson?",o:["Never ride matatus","Music brings joy","Radios are important","Sundays are boring"],c:1}
    ]
  },
  // 1 Monday – 6 Saturday (shortened – add real stories here)
  {title:"Monday – Lost Pencil",story:"Aisha forgot her pencil case…",questions:Array(10).fill({q:"…",o:["A","B","C","D"],c:0})},
  {title:"Tuesday – New Neighbour",story:"Nia was shy…",questions:Array(10).fill({q:"…",o:["A","B","C","D"],c:0})},
  {title:"Wednesday – Rainy Day",story:"…",questions:Array(10).fill({q:"…",o:["A","B","C","D"],c:0})},
  {title:"Thursday – Market Adventure",story:"…",questions:Array(10).fill({q:"…",o:["A","B","C","D"],c:0})},
  {title:"Friday – Football Match",story:"…",questions:Array(10).fill({q:"…",o:["A","B","C","D"],c:0})},
  {title:"Saturday – Family Picnic",story:"…",questions:Array(10).fill({q:"…",o:["A","B","C","D"],c:0})}
];

// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
let currentRole = localStorage.getItem("masasaRole") || null;
let assignments  = JSON.parse(localStorage.getItem("assignments") || "[]");
let teachers     = JSON.parse(localStorage.getItem("teachers") || "[]");
let englishAnswers = new Array(10).fill(null);
let currentQuestions = [];

// ──────────────────────────────────────────────
// DATE / TIME / WEATHER
// ──────────────────────────────────────────────
async function updateDateTimeAndWeather() {
  const timeEl   = document.getElementById("datetime");
  const wText    = document.getElementById("weather-text");
  const wIcon    = document.getElementById("weather-icon");

  // Date & time
  timeEl.textContent = new Date().toLocaleString("en-KE", {
    weekday:"long", year:"numeric", month:"long", day:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:true
  });

  // Weather
  if (!navigator.geolocation) {
    wText.textContent = "Location not supported";
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const {latitude, longitude} = pos.coords;
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=Africa/Nairobi`);
      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;

      let icon = "☀️";
      if ([51,53,55,61,63,65,80,81,82].includes(code)) icon = "🌧️";
      else if ([71,73,75,77].includes(code)) icon = "❄️";
      else if ([95,96,99].includes(code)) icon = "⛈️";

      wText.textContent = `${temp}°C • ${icon}`;
      wIcon.textContent = icon;
    } catch {
      wText.textContent = "Weather unavailable";
    }
  }, () => {
    wText.textContent = "Location access denied";
  });
}

// ──────────────────────────────────────────────
// ROLE & OVERLAY
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
  document.body.classList.toggle("learner-theme", role === "learner" || role === "parent");
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
  if (confirm("Change role?")) {
    localStorage.removeItem("masasaRole");
    currentRole = null;
    showWelcomeOverlay();
  }
}

// ──────────────────────────────────────────────
// ADMIN
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

function renderTeacherList() {
  document.getElementById("teacher-list").innerHTML = teachers.length
    ? teachers.map(t => `<div class="flex justify-between bg-gray-100 p-3 rounded-xl mb-2 text-sm"><span>${t.username}</span><span>Pass: ${t.password}</span></div>`).join("")
    : "<p class='text-gray-400 italic'>No teachers yet</p>";
}

function addNewTeacher() {
  const u = document.getElementById("new-teacher-user").value.trim();
  const p = document.getElementById("new-teacher-pass").value.trim();
  if (!u || !p) return alert("Both fields required");
  if (teachers.some(t => t.username === u)) return alert("Username already exists");
  teachers.push({username: u, password: p});
  localStorage.setItem("teachers", JSON.stringify(teachers));
  renderTeacherList();
  alert(`Teacher ${u} added!\nPassword: ${p}`);
}

function closeAdminModal() {
  document.getElementById("admin-modal").classList.add("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
}

// ──────────────────────────────────────────────
// ASSIGNMENTS
// ──────────────────────────────────────────────
function addAssignment() {
  const title = document.getElementById("ass-title").value.trim();
  const desc  = document.getElementById("ass-desc").value.trim();
  const pdf   = document.getElementById("ass-pdf").value.trim() || SAMPLE_PDF;
  if (!title) return alert("Title is required");
  assignments.unshift({id:Date.now(), title, desc, pdfUrl:pdf});
  localStorage.setItem("assignments", JSON.stringify(assignments));
  renderAssignments();
  document.getElementById("ass-title").value = "";
  document.getElementById("ass-desc").value = "";
  document.getElementById("ass-pdf").value = "";
}

function renderAssignments() {
  document.getElementById("assignments-list").innerHTML = assignments.length
    ? assignments.map(ass => `
        <div class="bg-white p-5 sm:p-6 rounded-2xl shadow hover:shadow-lg transition">
          <h3 class="font-bold text-lg mb-2">${ass.title}</h3>
          <p class="text-gray-600 mb-4 line-clamp-3">${ass.desc || "No description"}</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button onclick="window.open('${ass.pdfUrl}','_blank')" class="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex-1 hover:bg-blue-700">
              Open PDF
            </button>
            <button onclick="const a=document.createElement('a');a.href='${ass.pdfUrl}';a.download='${ass.title.replace(/'/g,"\\'")}.pdf';a.click();" class="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex-1 hover:bg-emerald-700">
              Download
            </button>
          </div>
        </div>
      `).join("")
    : "<p class='text-center text-gray-500 py-10'>No assignments yet</p>";
}

// ──────────────────────────────────────────────
// DAILY ENGLISH
// ──────────────────────────────────────────────
function renderDailyEnglish() {
  const day = new Date().getDay();
  const story = WEEKLY_ENGLISH_STORIES[day] || WEEKLY_ENGLISH_STORIES[0];

  document.querySelector("#english-section h2").textContent =
    `Daily English: ${story.title} (${new Date().toLocaleDateString('en-KE', {weekday:'long'})})`;

  document.querySelector("#english-section .bg-amber-50").innerHTML =
    `<strong>Story:</strong><br>${story.story}`;

  currentQuestions = story.questions;
  englishAnswers.fill(null);

  document.getElementById("english-questions").innerHTML = story.questions.map((q,i) => `
    <div class="mb-6">
      <p class="font-semibold mb-3">${i+1}. ${q.q}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${q.options.map((opt,idx) => `
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
  if (englishAnswers.includes(null)) return alert("Answer all 10 questions first");

  let correct = 0;
  englishAnswers.forEach((a,i) => { if (a === currentQuestions[i].correct) correct++; });

  const percent = Math.round(correct / 10 * 100);

  const emoji    = percent >= 80 ? "🎉🥳🔥✨" : percent >= 50 ? "👏😊👍" : "📚💪";
  const message  = percent >= 90 ? "Outstanding! You're a star!" :
                   percent >= 70 ? "Great job! Keep shining!" :
                   percent >= 50 ? "Good effort! Practice more!" : "Don't give up – try again tomorrow!";

  const container = document.getElementById("english-questions");
  container.innerHTML = `
    <div class="score-popup">
      <div class="text-6xl mb-4">${emoji}</div>
      <h3 class="text-5xl font-bold mb-3">${percent}%</h3>
      <p class="text-xl mb-2">${correct}/10 correct</p>
      <p class="text-lg mb-6">${message}</p>
      <button onclick="renderDailyEnglish()" class="bg-white text-emerald-800 px-8 py-3 rounded-xl font-bold hover:bg-gray-100">
        Try Again
      </button>
    </div>
  `;
}

// ──────────────────────────────────────────────
// TABS & UI VISIBILITY
// ──────────────────────────────────────────────
function switchTab(idx) {
  document.querySelectorAll(".tab-button").forEach(el => el.classList.remove("active"));
  document.getElementById(`tab-${idx}`).classList.add("active");

  ["assignments-section","quizzes-section","english-section"].forEach(id =>
    document.getElementById(id)?.classList.add("hidden")
  );

  if (idx === 0) document.getElementById("assignments-section")?.classList.remove("hidden");
  if (idx === 1) document.getElementById("quizzes-section")?.classList.remove("hidden");
  if (idx === 2) {
    document.getElementById("english-section")?.classList.remove("hidden");
    renderDailyEnglish();
  }
}

function renderAll() {
  const isTeacher = currentRole === "teacher";
  document.getElementById("teacher-assignments-form")?.classList.toggle("hidden", !isTeacher);
  renderAssignments();
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
window.onload = () => {
  if (!currentRole) {
    showWelcomeOverlay();
  } else {
    selectRole(currentRole);
  }

  updateDateTimeAndWeather();
  setInterval(updateDateTimeAndWeather, 600000); // 10 min

  renderAll();
};
