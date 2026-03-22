let currentQs = [], userAnswers = {}, stars = 0, pdfs = [], tQuizzes = [];

document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('masasa_role');
    stars = parseInt(localStorage.getItem('masasa_stars')) || 0;
    pdfs = JSON.parse(localStorage.getItem('masasa_pdfs')) || [];
    tQuizzes = JSON.parse(localStorage.getItem('masasa_tq')) || [];

    if(role) activateUI(role);
    updateStarUI();
    renderLearnerPlace();
    
    // Live Time
    setInterval(() => { 
        document.getElementById('live-time').innerText = new Date().toLocaleTimeString('en-GB'); 
    }, 1000);

    // Location API
    fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => document.getElementById('location-display').innerText = `📍 ${d.city}, ${d.country_name}`)
        .catch(() => document.getElementById('location-display').innerText = "📍 Nairobi, Kenya");
});

function activateUI(role) {
    document.getElementById('role-overlay').style.display = 'none';
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    if(role === 'admin') document.getElementById('admin-tools').classList.remove('hidden');
}

function selectRole(r) { localStorage.setItem('masasa_role', r); activateUI(r); }
function logout() { localStorage.removeItem('masasa_role'); location.reload(); }
function showAdminLogin() { 
    document.getElementById('role-buttons').classList.add('hidden'); 
    document.getElementById('admin-login').classList.remove('hidden'); 
}
function hideAdminLogin() { 
    document.getElementById('role-buttons').classList.remove('hidden'); 
    document.getElementById('admin-login').classList.add('hidden'); 
}
function validateAdmin() { 
    if(document.getElementById('admin-pass').value === 'admin123') selectRole('admin'); 
    else alert('Wrong Key!'); 
}

// Admin Logic
function uploadPDF() {
    const title = document.getElementById('pdf-title').value;
    const file = document.getElementById('pdf-file').files[0];
    if(!title || !file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        pdfs.unshift({ title, data: e.target.result, id: Date.now(), type: 'pdf' });
        localStorage.setItem('masasa_pdfs', JSON.stringify(pdfs));
        renderLearnerPlace();
        alert("PDF Published!");
    };
    reader.readAsDataURL(file);
}

function publishTeacherQuiz() {
    const title = document.getElementById('mq-title').value;
    const q = document.getElementById('mq-q').value;
    const a = document.getElementById('mq-a').value;
    const b = document.getElementById('mq-b').value;
    if(!title || !q || !a) return;
    const opts = [a, b, "None", "Both"].sort(() => Math.random() - 0.5);
    tQuizzes.unshift({ title, id: Date.now(), type: 'quiz', q, opts, correct: opts.indexOf(a) });
    localStorage.setItem('masasa_tq', JSON.stringify(tQuizzes));
    renderLearnerPlace();
    alert("Quiz Published!");
}

function renderLearnerPlace() {
    const container = document.getElementById('material-list');
    const isAdmin = !document.getElementById('admin-tools').classList.contains('hidden');
    const combined = [...tQuizzes, ...pdfs];
    container.innerHTML = combined.map(i => `
        <div class="${i.type==='quiz'?'bg-indigo-600 text-white':'bg-white'} p-6 rounded-[2.5rem] shadow-xl border-4 border-white text-center">
            <h4 class="font-black mb-3 truncate uppercase text-sm">${i.title}</h4>
            ${i.type==='quiz' ? 
                `<button onclick="startTQuiz(${i.id})" class="w-full bg-white text-indigo-600 py-3 rounded-2xl font-black shadow-md">START QUIZ</button>` :
                `<a href="${i.data}" download class="block w-full bg-orange-500 text-white py-3 rounded-2xl font-black shadow-md">GET PDF</a>`
            }
            ${isAdmin ? `<button onclick="deleteItem(${i.id}, '${i.type}')" class="text-[10px] mt-4 opacity-50 block w-full uppercase underline">Delete</button>` : ''}
        </div>
    `).join('');
}

function deleteItem(id, type) {
    if(type==='quiz') tQuizzes = tQuizzes.filter(q=>q.id!==id); 
    else pdfs = pdfs.filter(p=>p.id!==id);
    localStorage.setItem('masasa_tq', JSON.stringify(tQuizzes)); 
    localStorage.setItem('masasa_pdfs', JSON.stringify(pdfs));
    renderLearnerPlace();
}

// Cloud Logic
async function fetchCloudQuiz() {
    const sub = document.getElementById('subject-select').value;
    const lvl = document.getElementById('level-select').value;
    const btn = document.getElementById('start-cloud-btn');
    btn.innerText = "FETCHING... ☁️";
    try {
        const res = await fetch(`https://opentdb.com/api.php?amount=10&category=${sub}&difficulty=${lvl}&type=multiple`);
        const data = await res.json();
        currentQs = data.results.map(item => {
            const opts = [...item.incorrect_answers, item.correct_answer].sort(() => Math.random() - 0.5);
            return { q: decode(item.question), opts: opts.map(o=>decode(o)), correct: opts.indexOf(item.correct_answer) };
        });
        renderQuiz();
    } catch(e) { alert("API Offline!"); }
    btn.innerText = "START 10 Qs";
}

function startTQuiz(id) {
    const quiz = tQuizzes.find(q=>q.id===id);
    currentQs = [{ q: quiz.q, opts: quiz.opts, correct: quiz.correct }];
    renderQuiz();
}

function renderQuiz() {
    const area = document.getElementById('quiz-area');
    area.classList.remove('hidden');
    area.innerHTML = currentQs.map((q, i) => `
        <div id="q-block-${i+1}" class="quiz-card p-8 shadow-lg border-4 ${i===0?'active-q':''}">
            <p class="font-black text-xl mb-4 text-slate-700">${i+1}. ${q.q}</p>
            <div class="grid gap-3">
                ${q.opts.map((o, oi) => `<button onclick="handlePick(${i+1}, ${i}, ${oi}, this)" class="q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left bg-white w-full shadow-sm">${o}</button>`).join('')}
            </div>
        </div>
    `).join('') + `<button onclick="gradeQuiz()" class="w-full bg-indigo-600 text-white py-6 rounded-full font-black text-2xl shadow-xl mt-10">FINISH & SUBMIT</button>`;
    area.scrollIntoView({ behavior: 'smooth' });
}

function handlePick(qNum, qIdx, oIdx, btn) {
    const card = document.getElementById(`q-block-${qNum}`);
    card.querySelectorAll('.q-opt').forEach(b => b.className = "q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left bg-white w-full shadow-sm");
    btn.className = "q-opt p-5 rounded-2xl border-4 border-indigo-600 font-bold text-left bg-indigo-600 text-white w-full shadow-md";
    userAnswers[qIdx] = oIdx;

    card.classList.remove('active-q');
    card.classList.add('answered');

    const next = document.getElementById(`q-block-${qNum+1}`);
    if(next) {
        next.classList.add('active-q');
        setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }
}

function gradeQuiz() {
    let score = 0;
    currentQs.forEach((q, i) => { if(userAnswers[i] === q.correct) score++; });
    const p = Math.round((score/currentQs.length)*100);
    const s = Math.floor(p/10);
    stars += s; localStorage.setItem('masasa_stars', stars);
    updateStarUI();
    document.getElementById('final-percent').innerText = p + "%";
    document.getElementById('score-feedback').innerText = `Learner, you earned ${s} Stars!`;
    document.getElementById('score-emoji').innerText = p >= 80 ? "🏆" : "🥈";
    document.getElementById('score-modal').classList.remove('hidden');
}

function closeQuiz() { 
    document.getElementById('score-modal').classList.add('hidden'); 
    document.getElementById('quiz-area').classList.add('hidden'); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStarUI() { document.getElementById('star-count').innerText = stars; }
function showLevel() { 
    document.getElementById('level-select').classList.remove('hidden'); 
    document.getElementById('start-cloud-btn').classList.remove('hidden'); 
}
function decode(h) { const t = document.createElement("textarea"); t.innerHTML = h; return t.value; }
