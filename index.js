const ADMIN_PASS = "admin123";
let activeQuestions = [];
let userAnswers = {};

// 1. CLOCK & LOCATION
setInterval(() => {
    const timeEl = document.getElementById('live-time');
    if(timeEl) timeEl.textContent = new Date().toLocaleTimeString('en-GB');
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

function hideAdminLogin() {
    document.getElementById('role-buttons').classList.remove('hidden');
    document.getElementById('admin-login').classList.add('hidden');
}

function validateAdmin() {
    if(document.getElementById('admin-pass').value === ADMIN_PASS) {
        document.getElementById('admin-tools').classList.remove('hidden');
        selectRole('admin');
    } else { alert("Access Denied: Mr. Masasa, please check your key!"); }
}

function selectRole(role) {
    document.getElementById('role-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    window.scrollTo(0, 0);
}

function updateAnnouncement() {
    const val = document.getElementById('ann-input').value;
    if(val) {
        document.getElementById('marquee-text').textContent = val;
        localStorage.setItem('masasa_announcement', val);
        alert("Announcement live, Mr. Masasa! 📣");
    }
}

// 3. MOBILE WORKFLOW
function handleSubjectChange() {
    const subj = document.getElementById('subject-select').value;
    const container = document.getElementById('grade-container');
    if(subj) {
        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function handleGradeChange() {
    const grade = document.getElementById('grade-select').value;
    const btn = document.getElementById('start-btn');
    if(grade) {
        btn.classList.remove('hidden');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 4. AI QUIZ LOGIC (GRADES 1-9)
function generateAIQuiz() {
    const subject = document.getElementById('subject-select').value;
    const grade = document.getElementById('grade-select').value;
    const btn = document.getElementById('start-btn');
    
    btn.innerHTML = "AI IS GENERATING... 🤖";
    
    setTimeout(() => {
        activeQuestions = [];
        userAnswers = {};
        for(let i=0; i<5; i++) {
            activeQuestions.push(subject === 'numeracy' ? genMath(grade) : genEng(grade));
        }
        renderQuizArea();
        btn.innerHTML = "GENERATE QUESTIONS 🚀";
        
        const area = document.getElementById('quiz-area');
        area.classList.remove('hidden');
        window.scrollTo({ top: area.offsetTop - 120, behavior: 'smooth' });
    }, 800);
}

function genMath(grade) {
    const gLevel = grade.startsWith('P') ? 0 : parseInt(grade.substring(1));
    const n1 = Math.floor(Math.random() * (gLevel * 10 + 10)) + 5;
    const n2 = Math.floor(Math.random() * (gLevel * 5 + 5)) + 1;
    let q, ans;

    if (gLevel === 0) { // PP1-PP2
        q = `Which number is larger: ${n1} or ${n2}?`;
        ans = Math.max(n1, n2);
    } else if (gLevel <= 3) { // Lower Primary
        q = `What is ${n1} + ${n2}?`;
        ans = n1 + n2;
    } else if (gLevel <= 6) { // Upper Primary
        q = `Solve: ${n1} x ${n2}`;
        ans = n1 * n2;
    } else { // JSS Grade 7-9
        const x = Math.floor(Math.random() * 10) + 1;
        q = `Find x if: ${n2}x = ${n2 * x}`;
        ans = x;
    }
    const opts = shuffle([ans, ans + Math.floor(Math.random()*5)+1, ans - Math.floor(Math.random()*3)-1]);
    return { q, opts, correct: opts.indexOf(ans) };
}

function genEng(grade) {
    const gLevel = grade.startsWith('P') ? 0 : parseInt(grade.substring(1));
    const words = ["School", "Nature", "Technology", "Diversity", "Constitution", "Agriculture"];
    const word = words[Math.floor(Math.random()*words.length)];
    let q, ans;

    if (gLevel === 0) {
        q = `Complete the word: S_HOOL`;
        ans = "C";
    } else if (gLevel <= 6) {
        q = `Which word is a noun?`;
        ans = word;
    } else { // JSS
        q = `Choose the correct synonym for "Benevolent":`;
        ans = "Kind";
    }
    const opts = shuffle([ans, "Running", "Yellow"]);
    return { q, opts, correct: opts.indexOf(ans) };
}

function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

function renderQuizArea() {
    const area = document.getElementById('quiz-area');
    area.innerHTML = activeQuestions.map((q, idx) => `
        <div class="bg-white p-6 rounded-3xl shadow-lg border-b-8 border-indigo-100 animate-fade-in">
            <p class="font-black text-xl mb-4 text-slate-700">${idx+1}. ${q.q}</p>
            <div class="grid grid-cols-1 gap-3">
                ${q.opts.map((opt, oIdx) => `
                    <button onclick="pickAnswer(${idx}, ${oIdx}, this)" class="q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold hover:bg-indigo-50 text-left transition-all">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('') + `<button onclick="gradeQuiz()" class="w-full bg-green-500 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-green-600 transition-all">FINISH & GRADE 🤖</button>`;
}

function pickAnswer(qIdx, oIdx, btn) {
    btn.parentElement.querySelectorAll('.q-opt').forEach(b => b.className = "q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold bg-white text-left");
    btn.className = "q-opt p-5 rounded-2xl border-4 border-indigo-600 font-bold bg-indigo-600 text-white text-left";
    userAnswers[qIdx] = oIdx;
}

function gradeQuiz() {
    let score = 0;
    activeQuestions.forEach((q, i) => { if(userAnswers[i] === q.correct) score++; });
    const pct = Math.round((score / activeQuestions.length) * 100);
    
    document.getElementById('final-percent').textContent = pct + "%";
    document.getElementById('score-emoji').textContent = pct >= 80 ? "🏆" : pct >= 50 ? "🥈" : "📚";
    document.getElementById('score-feedback').textContent = pct >= 80 ? "Exceeding Expectations!" : "Meeting Expectations!";
    document.getElementById('score-modal').classList.remove('hidden');
}
