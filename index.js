const ADMIN_PASS = "admin123";
let activeQuestions = [];
let userAnswers = {};
let materials = JSON.parse(localStorage.getItem('masasa_lessons')) || [];

// 1. INITIALIZE & CLEANUP
document.addEventListener('DOMContentLoaded', () => {
    cleanExpiredPDFs();
    renderPDFs();
    setInterval(() => {
        const timeEl = document.getElementById('live-time');
        if(timeEl) timeEl.textContent = new Date().toLocaleTimeString('en-GB');
    }, 1000);
});

// 2. ADMIN PDF LOGIC (EVANS ONLY)
function uploadPDF() {
    const title = document.getElementById('pdf-title').value;
    const file = document.getElementById('pdf-file').files[0];
    const expiry = document.getElementById('pdf-expiry').value;

    if(!title || !file) return alert("Title and File required!");

    const reader = new FileReader();
    reader.onload = (e) => {
        materials.unshift({ title, data: e.target.result, expiry, id: Date.now() });
        localStorage.setItem('masasa_lessons', JSON.stringify(materials));
        renderPDFs();
        alert("Success: Lesson Posted!");
    };
    reader.readAsDataURL(file);
}

function renderPDFs() {
    const container = document.getElementById('pdf-list');
    const isAdmin = !document.getElementById('admin-tools').classList.contains('hidden');
    
    if(materials.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-slate-400 py-10 italic">No lesson files uploaded yet.</p>`;
        return;
    }

    container.innerHTML = materials.map(m => `
        <div class="bg-white p-6 rounded-[2.5rem] shadow-lg border-4 border-indigo-50">
            <h4 class="font-black text-indigo-700 text-lg mb-1 truncate">${m.title}</h4>
            <p class="text-[9px] font-bold text-slate-400 uppercase mb-4 tracking-widest">
                ${m.expiry ? `Expires: ${m.expiry}` : 'No Expiry Set'}
            </p>
            <a href="${m.data}" download="${m.title}.pdf" class="block w-full text-center bg-orange-500 text-white py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all">Download</a>
            ${isAdmin ? `<button onclick="deletePDF(${m.id})" class="text-red-400 text-[10px] mt-4 font-bold uppercase w-full text-center hover:underline">Delete Lesson</button>` : ''}
        </div>
    `).join('');
}

function deletePDF(id) {
    materials = materials.filter(m => m.id !== id);
    localStorage.setItem('masasa_lessons', JSON.stringify(materials));
    renderPDFs();
}

function cleanExpiredPDFs() {
    const now = new Date().toISOString().split('T')[0];
    materials = materials.filter(m => {
        if(!m.expiry) return true;
        return m.expiry >= now;
    });
    localStorage.setItem('masasa_lessons', JSON.stringify(materials));
}

// 3. NAVIGATION & WORKFLOW
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
        renderPDFs();
    } else { alert("Not Mr. Evans! Access Denied."); }
}

function selectRole(role) {
    document.getElementById('role-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    window.scrollTo(0, 0);
}

function handleSubjectChange() {
    const gradeBox = document.getElementById('grade-container');
    gradeBox.classList.remove('hidden');
    gradeBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function handleGradeChange() {
    const startBtn = document.getElementById('start-btn');
    startBtn.classList.remove('hidden');
    startBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateAnnouncement() {
    const val = document.getElementById('ann-input').value;
    if(val) {
        document.getElementById('marquee-text').textContent = val;
        alert("Marquee updated!");
    }
}

// 4. QUICK QUIZ CORE (10 QUESTIONS)
function generateAIQuiz() {
    const subject = document.getElementById('subject-select').value;
    const grade = document.getElementById('grade-select').value;
    const btn = document.getElementById('start-btn');
    
    btn.innerHTML = "PLEASE BE PATIENT, LEARNER... 🤖";
    
    setTimeout(() => {
        activeQuestions = [];
        userAnswers = {};

        if(subject === 'numeracy') {
            for(let i=0; i<10; i++) activeQuestions.push(genMath(grade));
        } else {
            // 5 Comprehension + 5 Grammar = 10 Total
            const passage = getPassage(grade);
            activeQuestions.push({ type: 'passage', text: passage.text });
            passage.questions.forEach(q => activeQuestions.push(q));
            for(let i=0; i<5; i++) activeQuestions.push(genGrammar(grade));
        }

        renderQuiz();
        btn.innerHTML = "GENERATE 10 QUESTIONS ✍️";
        const area = document.getElementById('quiz-area');
        area.classList.remove('hidden');
        window.scrollTo({ top: area.offsetTop - 120, behavior: 'smooth' });
    }, 1200);
}

function genMath(grade) {
    const gLevel = parseInt(grade.substring(1));
    const n1 = Math.floor(Math.random() * (gLevel * 10)) + 5;
    const n2 = Math.floor(Math.random() * (gLevel * 5)) + 2;
    const isPlus = Math.random() > 0.5;
    const ans = isPlus ? n1 + n2 : n1 - n2;
    const q = `Work out: ${n1} ${isPlus ? '+' : '-'} ${n2} = ?`;
    const opts = shuffle([ans, ans + 2, ans - 1]);
    return { type: 'q', q, opts, correct: opts.indexOf(ans) };
}

function getPassage(grade) {
    return {
        text: "The giant baobab tree stands tall in the village. Children love to play under its cool shade. In the morning, colourful birds build nests in its thick branches. At night, old men sit around the tree to tell stories about their ancestors.",
        questions: [
            { type: 'q', q: "Where does the baobab tree stand?", opts: shuffle(["In the village", "In the city", "By the sea"]), correct: 0 },
            { type: 'q', q: "When do the birds build nests?", opts: shuffle(["Morning", "Night", "Noon"]), correct: 0 },
            { type: 'q', q: "Who sits around the tree at night?", opts: shuffle(["Old men", "Babies", "Farmers"]), correct: 0 },
            { type: 'q', q: "The shade of the tree is...", opts: shuffle(["Cool", "Hot", "Dirty"]), correct: 0 },
            { type: 'q', q: "The birds are described as...", opts: shuffle(["Colourful", "Angry", "Quiet"]), correct: 0 }
        ]
    };
}

function genGrammar(grade) {
    const pool = [
        { q: "Choose the naming word (Noun):", a: "Table", o: ["Sing", "Table", "Quickly"] },
        { q: "Choose the doing word (Verb):", a: "Running", o: ["Running", "Red", "House"] },
        { q: "Which word starts with a capital letter?", a: "Kenya", o: ["school", "Kenya", "river"] },
        { q: "I have ____ apple in my bag.", a: "an", o: ["a", "an", "the"] }
    ];
    const pick = pool[Math.floor(Math.random()*pool.length)];
    const opts = shuffle(pick.o);
    return { type: 'q', q: pick.q, opts, correct: opts.indexOf(pick.a) };
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function renderQuiz() {
    const area = document.getElementById('quiz-area');
    let qCount = 1;
    area.innerHTML = activeQuestions.map((item, idx) => {
        if(item.type === 'passage') {
            return `<div class="bg-indigo-900 text-white p-8 rounded-[2.5rem] italic text-lg shadow-xl border-l-8 border-orange-500">
                        <span class="block text-xs font-black uppercase text-orange-400 mb-2">Reading Comprehension:</span>
                        "${item.text}"
                    </div>`;
        }
        return `
            <div class="bg-white p-8 rounded-[2.5rem] shadow-lg animate-fade-in">
                <p class="font-black text-xl mb-4 text-slate-700">${qCount++}. ${item.q}</p>
                <div class="grid grid-cols-1 gap-3">
                    ${item.opts.map((opt, oIdx) => `
                        <button onclick="pickAnswer(${idx}, ${oIdx}, this)" class="q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left hover:bg-indigo-50 transition-all">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('') + `<button onclick="gradeQuiz()" class="w-full bg-indigo-600 text-white py-6 rounded-full font-black text-2xl shadow-xl hover:bg-green-500">SUBMIT ANSWERS 🤖</button>`;
}

function pickAnswer(qIdx, oIdx, btn) {
    btn.parentElement.querySelectorAll('.q-opt').forEach(b => b.className = "q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold bg-white text-left");
    btn.className = "q-opt p-5 rounded-2xl border-4 border-indigo-600 font-bold bg-indigo-600 text-white text-left";
    userAnswers[qIdx] = oIdx;
}

function gradeQuiz() {
    let score = 0;
    const qs = activeQuestions.filter(i => i.type === 'q');
    activeQuestions.forEach((q, i) => { if(q.type === 'q' && userAnswers[i] === q.correct) score++; });
    const pct = Math.round((score / qs.length) * 100);
    document.getElementById('final-percent').textContent = pct + "%";
    document.getElementById('score-modal').classList.remove('hidden');
}
