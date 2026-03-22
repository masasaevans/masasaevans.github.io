const ADMIN_PASS = "admin123";
let activeQuestions = [], userAnswers = {}, materials = [], totalStars = 0;

// RECOVERY & SESSION
document.addEventListener('DOMContentLoaded', () => {
    const savedRole = localStorage.getItem('masasa_role');
    materials = JSON.parse(localStorage.getItem('masasa_lessons')) || [];
    totalStars = parseInt(localStorage.getItem('masasa_stars')) || 0;
    
    if(savedRole) restoreSession(savedRole);
    
    updateStarDisplay();
    updateStorageMeter();
    cleanExpiredPDFs();
    renderPDFs();
    
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
    if(confirm("Exit school portal? Your stars will be saved.")) {
        localStorage.removeItem('masasa_role');
        location.reload();
    }
}

async function fetchLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        document.getElementById('location-display').textContent = `📍 ${data.city}, ${data.country_name}`;
    } catch (e) { document.getElementById('location-display').textContent = "📍 Nairobi, Kenya"; }
}

// PDF ENGINE
function uploadPDF() {
    const title = document.getElementById('pdf-title').value, file = document.getElementById('pdf-file').files[0], expiry = document.getElementById('pdf-expiry').value;
    if(!title || !file) return alert("Missing info!");
    if(file.size > 2 * 1024 * 1024) return alert("PDF too big! Keep under 2MB.");

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            materials.unshift({ title, data: e.target.result, expiry, id: Date.now() });
            localStorage.setItem('masasa_lessons', JSON.stringify(materials));
            renderPDFs(); updateStorageMeter();
            alert("Published!");
        } catch (err) { alert("Storage Full!"); }
    };
    reader.readAsDataURL(file);
}

function renderPDFs() {
    const container = document.getElementById('pdf-list'), isAdmin = !document.getElementById('admin-tools').classList.contains('hidden');
    container.innerHTML = materials.length ? materials.map(m => `
        <div class="bg-white p-6 rounded-[2.5rem] shadow-lg border-4 border-indigo-50 text-center">
            <h4 class="font-black text-indigo-700 truncate mb-1">${m.title}</h4>
            <p class="text-[9px] font-black text-slate-400 mb-4 uppercase tracking-widest">${m.expiry ? 'EXP: '+m.expiry : 'OPEN'}</p>
            <a href="${m.data}" download="${m.title}.pdf" class="block w-full bg-orange-500 text-white py-3 rounded-2xl font-black">GET PDF</a>
            ${isAdmin ? `<button onclick="deletePDF(${m.id})" class="text-red-400 text-[10px] mt-4 font-black uppercase">Delete</button>` : ''}
        </div>
    `).join('') : `<p class="col-span-full text-center text-slate-400 py-10 italic">No lessons today.</p>`;
}

function deletePDF(id) {
    materials = materials.filter(m => m.id !== id);
    localStorage.setItem('masasa_lessons', JSON.stringify(materials));
    renderPDFs(); updateStorageMeter();
}

function cleanExpiredPDFs() {
    const today = new Date().toISOString().split('T')[0];
    materials = materials.filter(m => !m.expiry || m.expiry >= today);
    localStorage.setItem('masasa_lessons', JSON.stringify(materials));
}

function updateStorageMeter() {
    const used = JSON.stringify(localStorage).length;
    const pct = Math.min(Math.round((used / 5000000) * 100), 100);
    document.getElementById('storage-bar').style.width = pct + "%";
    document.getElementById('storage-pct').textContent = pct + "%";
}

// FOCUS MODE ENGINE
function generateAIQuiz() {
    const sub = document.getElementById('subject-select').value, grd = document.getElementById('grade-select').value, btn = document.getElementById('start-btn');
    btn.innerHTML = "BE PATIENT, LEARNER... 🤖";
    btn.disabled = true;

    setTimeout(() => {
        activeQuestions = []; userAnswers = {};
        if(sub === 'numeracy') {
            for(let i=0; i<10; i++) activeQuestions.push(genMath(grd));
        } else {
            const passage = { 
                text: "The sun is hot today. Juma is at the river. He saw a green frog jumping. Juma is happy.",
                qs: [
                    {q: "Where is Juma?", a: "River", o: ["River", "Market", "Home"]},
                    {q: "What color was the frog?", a: "Green", o: ["Green", "Blue", "Red"]},
                    {q: "Is Juma happy?", a: "Yes", o: ["Yes", "No", "Maybe"]}
                ]
            };
            activeQuestions.push({ type: 'passage', text: passage.text });
            passage.qs.forEach(q => activeQuestions.push({type:'q', q:q.q, opts:shuffle(q.o), correct:shuffle(q.o).indexOf(q.a)}));
            for(let i=0; i<7; i++) activeQuestions.push(genGrammar(grd)); // Total 10 Qs
        }
        renderQuiz();
        btn.innerHTML = "START 10 QUESTIONS ✍️"; btn.disabled = false;
        document.getElementById('quiz-area').classList.remove('hidden');
        document.getElementById('q-block-1')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1200);
}

function genMath(grade) {
    const g = parseInt(grade.substring(1)) || 1;
    const n1 = Math.floor(Math.random() * (g * 10)) + 5, n2 = Math.floor(Math.random() * (g * 5)) + 1;
    const isPlus = Math.random() > 0.5;
    const ans = isPlus ? n1 + n2 : n1 - n2;
    const opts = shuffle([ans, ans + 2, ans - 1]);
    return { type: 'q', q: `Juma has ${n1} coins. He ${isPlus ? 'gets' : 'gives away'} ${n2} coins. Total?`, opts, correct: opts.indexOf(ans) };
}

function genGrammar(grade) {
    const p = [{q: "Choose Verb:", a: "Run", o: ["Run", "Blue", "Cup"]}, {q: "Plural of Book:", a: "Books", o: ["Books", "Bookes", "Bookish"]}];
    const item = p[Math.floor(Math.random()*p.length)];
    const opts = shuffle(item.o);
    return { type: 'q', q: item.q, opts, correct: opts.indexOf(item.a) };
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function renderQuiz() {
    const area = document.getElementById('quiz-area');
    let qc = 1;
    area.innerHTML = activeQuestions.map((item, idx) => {
        if(item.type === 'passage') return `<div class="bg-indigo-900 text-white p-8 rounded-3xl italic shadow-xl border-l-8 border-orange-500 mb-8">"${item.text}"</div>`;
        return `
            <div id="q-block-${qc}" class="quiz-card p-8 shadow-lg border-4 ${qc===1?'active-q':''}">
                <p class="font-black text-xl mb-4 text-slate-700">${qc}. ${item.q}</p>
                <div class="grid gap-3">
                    ${item.opts.map((opt, oIdx) => `<button onclick="pickAnswer(${qc}, ${idx}, ${oIdx}, this)" class="q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left bg-white transition-all active:scale-95">${opt}</button>`).join('')}
                </div>
            </div>`;
        qc++;
        return html; // Placeholder for logic
    }).join('') + `<button id="submit-quiz-btn" onclick="gradeQuiz()" class="w-full bg-indigo-600 text-white py-6 rounded-full font-black text-2xl shadow-xl">SUBMIT 🤖</button>`;
    
    // Manual adjustment for QC counter logic in map
    let finalHtml = "";
    let qNum = 1;
    activeQuestions.forEach((item, idx) => {
        if(item.type === 'passage') {
            finalHtml += `<div class="bg-indigo-900 text-white p-8 rounded-3xl italic shadow-xl border-l-8 border-orange-500 mb-8">"${item.text}"</div>`;
        } else {
            finalHtml += `
                <div id="q-block-${qNum}" class="quiz-card p-8 shadow-lg border-4 ${qNum===1?'active-q':''}">
                    <p class="font-black text-xl mb-4 text-slate-700">${qNum}. ${item.q}</p>
                    <div class="grid gap-3">
                        ${item.opts.map((opt, oIdx) => `<button onclick="pickAnswer(${qNum}, ${idx}, ${oIdx}, this)" class="q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left bg-white transition-all">${opt}</button>`).join('')}
                    </div>
                </div>`;
            qNum++;
        }
    });
    area.innerHTML = finalHtml + `<button id="submit-quiz-btn" onclick="gradeQuiz()" class="w-full bg-indigo-600 text-white py-6 rounded-full font-black text-2xl shadow-xl">FINISH & SUBMIT 🤖</button>`;
}

function pickAnswer(qNum, qIdx, oIdx, btn) {
    const parent = document.getElementById(`q-block-${qNum}`);
    parent.querySelectorAll('.q-opt').forEach(b => { b.className = "q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left bg-white"; });
    btn.className = "q-opt p-5 rounded-2xl border-4 border-indigo-600 font-bold text-left bg-indigo-600 text-white";
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
    }, 400);
}

function gradeQuiz() {
    let score = 0, qs = activeQuestions.filter(i => i.type === 'q');
    activeQuestions.forEach((q, i) => { if(q.type === 'q' && userAnswers[i] === q.correct) score++; });
    const pct = Math.round((score / qs.length) * 100), stars = Math.floor(pct / 10);
    totalStars += stars;
    localStorage.setItem('masasa_stars', totalStars);
    updateStarDisplay();
    document.getElementById('final-percent').textContent = pct + "%";
    document.getElementById('score-feedback').textContent = `You earned ${stars} Stars! ⭐`;
    document.getElementById('score-modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('score-modal').classList.add('hidden'); document.getElementById('quiz-area').classList.add('hidden'); window.scrollTo(0,0); }
function updateStarDisplay() { document.getElementById('star-count').textContent = totalStars; }
function showAdminLogin() { document.getElementById('role-buttons').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideAdminLogin() { document.getElementById('role-buttons').classList.remove('hidden'); document.getElementById('admin-login').classList.add('hidden'); }
function validateAdmin() { if(document.getElementById('admin-pass').value === ADMIN_PASS) { selectRole('admin'); } else { alert("Wrong Key!"); } }
function updateAnnouncement() { document.getElementById('marquee-text').textContent = document.getElementById('ann-input').value; alert("Updated!"); }
function handleSubjectChange() { document.getElementById('grade-container').classList.remove('hidden'); }
function handleGradeChange() { document.getElementById('start-btn').classList.remove('hidden'); }
