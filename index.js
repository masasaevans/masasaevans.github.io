const ADMIN_PASS = "admin123";
let activeQuestions = [];
let userAnswers = {};

// 1. CLOCK & LOCATION
setInterval(() => {
    document.getElementById('live-time').textContent = new Date().toLocaleTimeString('en-GB');
}, 1000);

async function fetchLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        document.getElementById('location-display').textContent = `📍 ${data.city}, ${data.country_name}`;
    } catch (e) { document.getElementById('location-display').textContent = "📍 Nairobi, Kenya"; }
}
fetchLocation();

// 2. ADMIN & ROLES
function showAdminLogin() {
    document.getElementById('role-buttons').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
}

function validateAdmin() {
    if(document.getElementById('admin-pass').value === ADMIN_PASS) {
        document.getElementById('admin-tools').classList.remove('hidden');
        selectRole('admin');
    } else { alert("Incorrect Key!"); }
}

function selectRole(role) {
    document.getElementById('role-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
}

function updateAnnouncement() {
    const val = document.getElementById('ann-input').value;
    if(val) {
        document.getElementById('marquee-text').textContent = val;
        localStorage.setItem('masasa_announcement', val);
        alert("Announcement Updated! 📣");
    }
}

// 3. CBC & JSS AI ENGINE
function showGrades() {
    document.getElementById('grade-select').classList.remove('hidden');
    document.getElementById('start-btn').classList.remove('hidden');
}

function generateAIQuiz() {
    const subject = document.getElementById('subject-select').value;
    const grade = document.getElementById('grade-select').value;
    activeQuestions = [];
    userAnswers = {};

    for(let i=0; i<5; i++) {
        activeQuestions.push(subject === 'numeracy' ? genMath(grade) : genEng(grade));
    }
    renderQuiz();
}

function genMath(grade) {
    const n1 = Math.floor(Math.random() * 50) + 10;
    const n2 = Math.floor(Math.random() * 20) + 2;
    let q, ans;

    if (grade.startsWith('P')) { // PP1-PP2
        q = `Which number is bigger: ${n1} or ${n2}?`;
        ans = Math.max(n1, n2);
    } else if (parseInt(grade[1]) <= 3) { // Grade 1-3
        q = `What is ${n1} + ${n2}?`;
        ans = n1 + n2;
    } else if (parseInt(grade[1]) <= 6) { // Grade 4-6
        q = `Find the product of ${n1} and ${n2}:`;
        ans = n1 * n2;
    } else { // JSS Grade 7-9
        const x = Math.floor(Math.random() * 5) + 1;
        q = `Solve for x: ${n2}x = ${n2 * x}`;
        ans = x;
    }
    const opts = shuffle([ans, ans + 3, ans - 2]);
    return { q, opts, correct: opts.indexOf(ans) };
}

function genEng(grade) {
    const vocabulary = ["Ecosystem", "Photosynthesis", "Democracy", "Agriculture", "Technology"];
    const word = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    let q, ans;

    if (grade.startsWith('P')) {
        q = `Choose the missing letter: A _ P L E`;
        ans = "P";
    } else if (parseInt(grade[1]) <= 6) {
        q = `Which is a synonym of "Happy"?`;
        ans = "Joyful";
    } else { // JSS Grade 7-9
        q = `Identify the correct word: A person who studies plants is a...`;
        ans = "Botanist";
    }
    const opts = shuffle([ans, "Artist", "Driver"]);
    return { q, opts, correct: opts.indexOf(ans) };
}

function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

function renderQuiz() {
    const area = document.getElementById('quiz-area');
    area.classList.remove('hidden');
    area.innerHTML = activeQuestions.map((q, idx) => `
        <div class="bg-white p-6 rounded-3xl shadow-lg border-b-8 border-indigo-100 animate-fade-in">
            <p class="font-black text-xl mb-4 text-slate-700">${idx+1}. ${q.q}</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                ${q.opts.map((opt, oIdx) => `
                    <button onclick="pickAnswer(${idx}, ${oIdx}, this)" class="q-opt p-4 rounded-xl border-2 border-indigo-50 font-bold hover:bg-indigo-50 transition-all">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('') + `<button onclick="gradeQuiz()" class="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-2xl shadow-xl hover:bg-green-500 transition-colors">SUBMIT ANSWERS 🤖</button>`;
}

function pickAnswer(qIdx, oIdx, btn) {
    btn.parentElement.querySelectorAll('.q-opt').forEach(b => b.className = "q-opt p-4 rounded-xl border-2 border-indigo-50 font-bold bg-white");
    btn.className = "q-opt p-4 rounded-xl border-2 border-indigo-600 font-bold bg-indigo-600 text-white";
    userAnswers[qIdx] = oIdx;
}

function gradeQuiz() {
    let score = 0;
    activeQuestions.forEach((q, i) => { if(userAnswers[i] === q.correct) score++; });
    const pct = Math.round((score / activeQuestions.length) * 100);
    document.getElementById('final-percent').textContent = pct + "%";
    document.getElementById('score-modal').classList.remove('hidden');
}
