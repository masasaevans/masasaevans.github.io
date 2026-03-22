const ADMIN_PASS = "admin123";
let activeQuestions = [], userAnswers = {}, materials = [], totalStars = 0;

// INITIALIZATION & SESSION PERSISTENCE
document.addEventListener('DOMContentLoaded', () => {
    const savedRole = localStorage.getItem('masasa_role');
    materials = JSON.parse(localStorage.getItem('masasa_lessons')) || [];
    totalStars = parseInt(localStorage.getItem('masasa_stars')) || 0;
    
    // If refreshed, keep them on the page they were on
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
    if(confirm("Are you sure you want to exit the school portal?")) {
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

// ADMIN PDF ENGINE
function uploadPDF() {
    const title = document.getElementById('pdf-title').value, file = document.getElementById('pdf-file').files[0], expiry = document.getElementById('pdf-expiry').value;
    if(!title || !file) return alert("Missing Title or File!");
    if(file.size > 2.2 * 1024 * 1024) return alert("File too large! Max 2.2MB for local storage.");

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            materials.unshift({ title, data: e.target.result, expiry, id: Date.now() });
            localStorage.setItem('masasa_lessons', JSON.stringify(materials));
            renderPDFs(); updateStorageMeter();
            alert("Lesson Published to Learner Place!");
        } catch (err) { alert("Browser Storage Full! Delete old lessons first."); }
    };
    reader.readAsDataURL(file);
}

function renderPDFs() {
    const container = document.getElementById('pdf-list'), isAdmin = !document.getElementById('admin-tools').classList.contains('hidden');
    container.innerHTML = materials.length ? materials.map(m => `
        <div class="bg-white p-6 rounded-[2.5rem] shadow-lg border-4 border-indigo-50 text-center">
            <h4 class="font-black text-indigo-700 truncate mb-1">${m.title}</h4>
            <p class="text-[9px] font-black text-slate-400 mb-4 uppercase tracking-widest">${m.expiry ? 'EXP: '+m.expiry : 'OPEN ACCESS'}</p>
            <a href="${m.data}" download="${m.title}.pdf" class="block w-full bg-orange-500 text-white py-3 rounded-2xl font-black hover:bg-indigo-600 transition-all">DOWNLOAD</a>
            ${isAdmin ? `<button onclick="deletePDF(${m.id})" class="text-red-400 text-[10px] mt-4 font-black uppercase tracking-widest hover:underline">Delete</button>` : ''}
        </div>
    `).join('') : `<p class="col-span-full text-center text-slate-400 py-10 italic">Checking for new lessons...</p>`;
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

// FOCUS MODE QUIZ ENGINE (AUTO-SCROLL)
function generateAIQuiz() {
    const sub = document.getElementById('subject-select').value, grd = document.getElementById('grade-select').value, btn = document.getElementById('start-btn');
    btn.innerHTML = "PLEASE BE PATIENT, LEARNER... 🤖";
    btn.disabled = true;

    setTimeout(() => {
        activeQuestions = []; userAnswers = {};
        if(sub === 'numeracy') {
            for(let i=0; i<10; i++) activeQuestions.push(genMath(grd));
        } else {
            const passage = { 
                text: "The sun was hot in Nairobi. Juma went to the river to find cool water. He saw a big green frog jumping. Juma laughed and sat under a leafy tree.",
                qs: [
                    {q: "Where did Juma go?", a: "River", o: ["River", "School", "Market"]},
                    {q: "What color was the frog?", a: "Green", o: ["Blue", "Green", "Red"]},
                    {q: "What was the frog doing?", a: "Jumping", o: ["Singing", "Jumping", "Sleeping"]},
                    {q: "How was the sun?", a: "Hot", o: ["Cold", "Hot", "Cloudy"]},
                    {q: "Where did Juma sit?", a: "Under a tree", o: ["On a rock", "In the car", "Under a tree"]}
                ]
            };
            activeQuestions.push({ type: 'passage', text: passage.text });
            passage.qs.forEach(q => activeQuestions.push({type:'q', q:q.q, opts:shuffle(q.o), correct:shuffle(q.o).indexOf(q.a), hint:"Read the passage again!"}));
            for(let i=0; i<5; i++) activeQuestions.push(genGrammar(grd));
        }
        renderQuiz();
        btn.innerHTML = "GENERATE 10 QUESTIONS ✍️"; btn.disabled = false;
        document.getElementById('quiz-area').classList.remove('hidden');
        document.getElementById('quiz-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1500);
}

function genMath(grade) {
    const g = parseInt(grade.substring(1)) || 1;
    const n1 = Math.floor(Math.random() * (g * 10)) + 10, n2 = Math.floor(Math.random() * (g * 5)) + 2;
    const isPlus = Math.random() > 0.5;
    const ans = isPlus ? n1 + n2 : n1 - n2;
    const opts = shuffle([ans, ans + 2, ans - 3]);
    return { type: 'q', q: `Juma has ${n1} coins. He ${isPlus ? 'finds' : 'loses'} ${n2} coins. How many does he have now?`, opts, correct: opts.indexOf(ans), hint: isPlus ? "Plus (+) means more." : "Minus (-) means less." };
}

function genGrammar(grade) {
    const pool = [{q: "Choose the Verb (Doing Word):", a: "Running", o: ["Running", "Red", "Table"]}, {q: "Choose the Noun (Naming Word):", a: "Kenya", o: ["Sing", "Kenya", "Quickly"]}];
    const p = pool[Math.floor(Math.random()*pool.length)];
    const opts = shuffle(p.o);
    return { type: 'q', q: p.q, opts, correct: opts.indexOf(p.a), hint: "Think of an action or a place." };
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function renderQuiz() {
    const area = document.getElementById('quiz-area');
    let qc = 1;
    area.innerHTML = activeQuestions.map((item, idx) => {
        if(item.type === 'passage') return `<div class="bg-indigo-900 text-white p-8 rounded-3xl italic shadow-xl border-l-8 border-orange-500 text-lg mb-8">"${item.text}"</div>`;
        return `
            <div id="q-block-${idx}" class="quiz-card p-8 shadow-lg border-4 border-white">
                <p class="font-black text-xl mb-4 text-slate-700">${qc++}. ${item.q}</p>
                <div class="grid gap-3">
                    ${item.opts.map((opt, oIdx) => `<button onclick="pickAnswer(${idx}, ${oIdx}, this)" class="q-opt p-5 rounded-2xl border-4 border-indigo-50 font-bold text-left bg-white transition-all active:scale-95">${opt}</button>`).join('')}
                </div>
                <details class="mt-4"><summary class="text-xs font-black text-indigo-400 cursor-pointer uppercase">Hint</summary><p class="mt-2 text-sm text-slate-500 italic bg-indigo-50 p-3 rounded-xl">${item.hint || "Try your best!"}</p></details>
            </div>`;
    }).join('') + `<button id="submit-quiz-btn" onclick="gradeQuiz()" class="w-full bg-indigo-600 text-white py-6 rounded-full font-black text-2xl shadow-xl hover:bg-green-500 transition-all">FINISH & SUBMIT 🤖</button>`;
}

// AUTO-SCROLL LOGIC
function pickAnswer(qIdx, oIdx, btn) {
    const parent = btn.parentElement.parentElement;
    parent.querySelectorAll('.q-opt').forEach(b => { b.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600'); b.classList.add('bg-white', 'border-indigo-50'); });
    btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
    userAnswers[qIdx] = oIdx;
    parent.classList.add('answered');

    // Smooth scroll to next question
    const nextQ = document.getElementById(`q-block-${qIdx + 1}`);
    const submitBtn = document.getElementById('submit-quiz-btn');
    
    setTimeout(() => {
        if(nextQ) {
            nextQ.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if(submitBtn) {
            submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    document.getElementById('score-feedback').textContent = `Learner, you earned ${stars} Stars! ⭐`;
    document.getElementById('score-emoji').textContent = pct >= 80 ? "🏆" : "🥈";
    document.getElementById('score-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('score-modal').classList.add('hidden');
    document.getElementById('quiz-area').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStarDisplay() { document.getElementById('star-count').textContent = totalStars; }
function showAdminLogin() { document.getElementById('role-buttons').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideAdminLogin() { document.getElementById('role-buttons').classList.remove('hidden'); document.getElementById('admin-login').classList.add('hidden'); }
function validateAdmin() { if(document.getElementById('admin-pass').value === ADMIN_PASS) { selectRole('admin'); } else { alert("Incorrect Key!"); } }
function updateAnnouncement() { if(document.getElementById('ann-input').value) { document.getElementById('marquee-text').textContent = document.getElementById('ann-input').value; alert("Banner Updated!"); } }
function handleSubjectChange() { document.getElementById('grade-container').classList.remove('hidden'); document.getElementById('grade-container').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function handleGradeChange() { document.getElementById('start-btn').classList.remove('hidden'); document.getElementById('start-btn').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
