const ADMIN_PASS = "admin123";
let activeQuestions = [], userAnswers = {}, totalStars = 0;
let pdfData = [], manualQuizzes = [];

document.addEventListener('DOMContentLoaded', () => {
    // Session Recovery
    const savedRole = localStorage.getItem('masasa_role');
    pdfData = JSON.parse(localStorage.getItem('masasa_pdfs')) || [];
    manualQuizzes = JSON.parse(localStorage.getItem('masasa_teacher_qs')) || [];
    totalStars = parseInt(localStorage.getItem('masasa_stars')) || 0;

    if(savedRole) restoreSession(savedRole);
    updateStarDisplay();
    renderLearnerPlace();
    
    setInterval(() => {
        document.getElementById('live-time').textContent = new Date().toLocaleTimeString('en-GB');
    }, 1000);
    fetchLocation();
});

function restoreSession(role) {
    document.getElementById('role-overlay').style.display = 'none';
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    if(role === 'admin') document.getElementById('admin-tools').classList.remove('hidden');
}

function selectRole(role) {
    localStorage.setItem('masasa_role', role);
    restoreSession(role);
}

function quitPortal() {
    if(confirm("Exit school? Stars are saved!")) {
        localStorage.removeItem('masasa_role');
        location.reload();
    }
}

// FETCH LOCATION
async function fetchLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        document.getElementById('location-display').textContent = `📍 ${data.city}, ${data.country_name}`;
    } catch (e) { document.getElementById('location-display').textContent = "📍 Nairobi, Kenya"; }
}

// ADMIN FUNCTIONS
function uploadPDF() {
    const title = document.getElementById('pdf-title').value;
    const file = document.getElementById('pdf-file').files[0];
    if(!title || !file) return alert("Fill all fields");

    const reader = new FileReader();
    reader.onload = (e) => {
        pdfData.unshift({ title, data: e.target.result, id: Date.now(), type: 'pdf' });
        localStorage.setItem('masasa_pdfs', JSON.stringify(pdfData));
        renderLearnerPlace();
    };
    reader.readAsDataURL(file);
}

function publishTeacherQuiz() {
    const title = document.getElementById('mq-title').value;
    const q = document.getElementById('mq-q').value;
    const correct = document.getElementById('mq-a').value;
    const opts = shuffle([correct, document.getElementById('mq-b').value, document.getElementById('mq-c').value, document.getElementById('mq-d').value]);
    
    if(!title || !q || !correct) return alert("Fill quiz fields");

    manualQuizzes.unshift({ 
        title, 
        id: Date.now(), 
        type: 'quiz', 
        questions: [{ q, opts, correct: opts.indexOf(correct) }] 
    });
    localStorage.setItem('masasa_teacher_qs', JSON.stringify(manualQuizzes));
    renderLearnerPlace();
    alert("Quiz Published!");
}

// RENDER LEARNER PLACE (PDFs + QUIZZES)
function renderLearnerPlace() {
    const container = document.getElementById('material-list');
    const isAdmin = !document.getElementById('admin-tools').classList.contains('hidden');
    
    const allMaterials = [...manualQuizzes, ...pdfData];
    container.innerHTML = allMaterials.map(m => `
        <div class="${m.type==='quiz'?'bg-indigo-600':'bg-white'} p-6 rounded-[2.5rem] shadow-xl border-4 border-white text-center">
            <h4 class="font-black ${m.type==='quiz'?'text-white':'text-indigo-700'} truncate mb-3">${m.title}</h4>
            ${m.type==='quiz' ? 
                `<button onclick="startManualQuiz(${m.id})" class="w-full bg-white text-indigo-600 py-3 rounded-2xl font-black">START QUIZ</button>` :
                `<a href="${m.data}" download="${m.title}.pdf" class="block w-full bg-orange-500 text-white py-3 rounded-2xl font-black">GET PDF</a>`
            }
            ${isAdmin ? `<button onclick="deleteItem(${m.id}, '${m.type}')" class="text-[10px] mt-4 opacity-50 block w-full text-center uppercase text-red-300">Delete</button>` : ''}
        </div>
    `).join('');
}

function deleteItem(id, type) {
    if(type === 'quiz') manualQuizzes = manualQuizzes.filter(q => q.id !== id);
    else pdfData = pdfData.filter(p => p.id !== id);
    localStorage.setItem('masasa_teacher_qs', JSON.stringify(manualQuizzes));
    localStorage.setItem('masasa_pdfs', JSON.stringify(pdfData));
    renderLearnerPlace();
}

// CLOUD QUIZ ENGINE
async function generateCloudQuiz() {
    const sub = document.getElementById('subject-select').value;
    const diff = document.getElementById('grade-select').value;
    const btn = document.getElementById('start-btn');
    btn.innerHTML = "FETCHING QUESTIONS... ☁️";
    
    const cat = sub === 'literacy' ? 9 : 17; // 9: General, 17: Science/Math
    const url = `https://opentdb.com/api.php?amount=10&category=${cat}&difficulty=${diff}&type=multiple`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        activeQuestions = data.results.map(item => {
            const opts = shuffle([...item.incorrect_answers, item.correct_answer]);
            return {
                type: 'q',
                q: decodeHtml(item.question),
                opts: opts.map(o => decodeHtml(o)),
                correct: opts.indexOf(item.correct_answer)
            };
        });
        renderQuiz();
        btn.innerHTML = "FETCH 10 QUESTIONS ✍️";
        document.getElementById('quiz-area').classList.remove('hidden');
        document.getElementById('q-block-1').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) { alert("Offline? Check your internet."); btn.innerHTML = "RETRY 🔄"; }
}

function startManualQuiz(id) {
    const quiz = manualQuizzes.find(q => q.id === id);
    activeQuestions = quiz.questions.map(q => ({...q, type: 'q'}));
    renderQuiz();
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('q-block-1').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderQuiz() {
    const area = document.getElementById('quiz-area');
    let qNum = 1;
    let html = activeQuestions.map((item, idx) => `
        <div id="q-block-${qNum}" class="quiz-card p-8 shadow-lg border-4 ${qNum===1?'active-q':''}">
            <p class="font-black text-xl mb-4 text-slate-700">${qNum++}. ${item.q}</p>
            <div class="grid gap-3">
                ${item.opts.map((opt, oIdx) => `<button onclick="pickAnswer(${qNum-1}, ${idx}, ${oIdx}, this)" class="q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left bg-white transition-all">${opt}</button>`).join('')}
            </div>
        </div>
    `).join('');
    area.innerHTML = html + `<button id="submit-quiz-btn" onclick="gradeQuiz()" class="w-full bg-indigo-600 text-white py-6 rounded-full font-black text-2xl shadow-xl">FINISH QUIZ</button>`;
}

function pickAnswer(qNum, qIdx, oIdx, btn) {
    const parent = document.getElementById(`q-block-${qNum}`);
    parent.querySelectorAll('.q-opt').forEach(b => { 
        b.className = "q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left bg-white w-full transition-all"; 
    });
    btn.className = "q-opt p-5 rounded-2xl border-4 border-indigo-600 font-bold text-left bg-indigo-600 text-white w-full";
    userAnswers[qIdx] = oIdx;
    
    parent.classList.remove('active-q');
    parent.classList.add('answered');

    const nextQ = document.getElementById(`q-block-${qNum + 1}`);
    setTimeout(() => {
        if(nextQ) {
            nextQ.classList.add('active-q');
            nextQ.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            document.getElementById('submit-quiz-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 500);
}

function gradeQuiz() {
    let score = 0;
    activeQuestions.forEach((q, i) => { if(userAnswers[i] === q.correct) score++; });
    const pct = Math.round((score / activeQuestions.length) * 100);
    const stars = Math.floor(pct / 10);
    totalStars += stars;
    localStorage.setItem('masasa_stars', totalStars);
    updateStarDisplay();
    
    document.getElementById('final-percent').textContent = pct + "%";
    document.getElementById('score-feedback').textContent = `You earned ${stars} Stars! ⭐`;
    document.getElementById('score-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('score-modal').classList.add('hidden');
    document.getElementById('quiz-area').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// UTILS
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function decodeHtml(html) { const t = document.createElement("textarea"); t.innerHTML = html; return t.value; }
function updateStarDisplay() { document.getElementById('star-count').textContent = totalStars; }
function showAdminLogin() { document.getElementById('role-buttons').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideAdminLogin() { document.getElementById('role-buttons').classList.remove('hidden'); document.getElementById('admin-login').classList.add('hidden'); }
function validateAdmin() { if(document.getElementById('admin-pass').value === ADMIN_PASS) selectRole('admin'); else alert("Wrong Key!"); }
function handleSubjectChange() { document.getElementById('grade-container').classList.remove('hidden'); }
function handleGradeChange() { document.getElementById('start-btn').classList.remove('hidden'); }
