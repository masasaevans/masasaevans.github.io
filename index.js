const ADMIN_PASS = "admin123";
let currentRole = null;
let uploadedMaterials = JSON.parse(localStorage.getItem('masasa_materials')) || [];
let savedQuizzes = JSON.parse(localStorage.getItem('masasa_quizzes')) || [];
let marqueeText = localStorage.getItem('masasa_announcement') || "Welcome to Masasa Online! Check out our new lessons.";

// 1. INITIALIZE PAGE
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('marquee-text').textContent = marqueeText;
    fetchCityLocation();
    setInterval(updateClock, 1000);
});

function updateClock() {
    const timeEl = document.getElementById('live-time');
    if(timeEl) timeEl.textContent = new Date().toLocaleTimeString('en-GB');
}

// 2. LOCATION (IP-BASED)
async function fetchCityLocation() {
    const locEl = document.getElementById('location-display');
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        locEl.textContent = `🌍 ${data.city}, ${data.country_name}`;
    } catch (e) {
        locEl.textContent = "🌍 Nairobi, Kenya";
    }
}

// 3. ADMIN LOGIC
function showAdminLogin() {
    document.getElementById('role-buttons').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
}

function hideAdminLogin() {
    document.getElementById('role-buttons').classList.remove('hidden');
    document.getElementById('admin-login').classList.add('hidden');
}

function validateAdmin() {
    const pass = document.getElementById('admin-pass').value;
    if(pass === ADMIN_PASS) {
        currentRole = 'admin';
        document.getElementById('admin-tools').classList.remove('hidden');
        enterPortal();
    } else { alert("Incorrect Key!"); }
}

function selectRole(role) {
    currentRole = role;
    enterPortal();
}

function enterPortal() {
    document.getElementById('role-overlay').style.display = 'none';
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    renderMaterials();
    renderQuiz();
}

// 4. ADMIN DASHBOARD ACTIONS
function updateAnnouncement() {
    const text = document.getElementById('ann-input').value;
    if(text) {
        marqueeText = text;
        localStorage.setItem('masasa_announcement', text);
        document.getElementById('marquee-text').textContent = text;
        alert("Announcement Updated! 📣");
    }
}

function saveQuiz() {
    const q = document.getElementById('quiz-q').value;
    const o0 = document.getElementById('opt-0').value;
    const o1 = document.getElementById('opt-1').value;
    const o2 = document.getElementById('opt-2').value;
    const correct = document.getElementById('correct-opt').value;

    if(!q || !o0 || !o1 || !o2) return alert("Fill all quiz fields!");

    savedQuizzes.push({ q, options: [o0, o1, o2], correct: parseInt(correct) });
    localStorage.setItem('masasa_quizzes', JSON.stringify(savedQuizzes));
    alert("Quiz Question Added! ✍️");
    renderQuiz();
}

// 5. LEARNER EXPERIENCE
function renderQuiz() {
    const area = document.getElementById('quiz-display');
    if(savedQuizzes.length === 0) {
        area.innerHTML = `<p class="font-bold text-slate-400">No quizzes available today.</p>`;
        return;
    }

    area.innerHTML = savedQuizzes.map((q, idx) => `
        <div class="mb-10 p-6 border-b-2 border-indigo-50 last:border-0">
            <h4 class="text-2xl font-black text-slate-800 mb-6">${idx+1}. ${q.q}</h4>
            <div class="grid grid-cols-1 gap-3 max-w-md mx-auto">
                ${q.options.map((opt, oIdx) => `
                    <button onclick="selectAnswer(this, ${idx}, ${oIdx})" 
                            class="quiz-option p-4 rounded-2xl border-2 border-indigo-100 font-bold hover:bg-indigo-50 transition-all">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('') + `<button onclick="gradeQuiz()" class="mt-8 bg-indigo-600 text-white px-12 py-4 rounded-full font-black text-xl shadow-lg">FINISH & GRADE</button>`;
}

let userAnswers = {};
function selectAnswer(btn, qIdx, oIdx) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600'));
    btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
    userAnswers[qIdx] = oIdx;
}

function gradeQuiz() {
    let score = 0;
    savedQuizzes.forEach((q, i) => {
        if(userAnswers[i] === q.correct) score++;
    });

    const percent = Math.round((score / savedQuizzes.length) * 100);
    document.getElementById('final-percent').textContent = `${percent}%`;
    document.getElementById('score-modal').classList.remove('hidden');
}

function checkComprehension() {
    const ans = document.getElementById('comp-a1').value.toLowerCase();
    if(ans.includes("savanna")) {
        alert("Correct! 🦁 Excellent reading skills!");
    } else {
        alert("Not quite! Hint: Look at the first sentence of the story.");
    }
}

function closeScore() {
    document.getElementById('score-modal').classList.add('hidden');
    location.reload();
}

// REUSABLE TAB LOGIC
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'text-indigo-700', 'border-indigo-600');
        b.classList.add('text-slate-400', 'border-transparent');
    });
    
    document.getElementById(`${tab}-section`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-${tab}`);
    activeBtn.classList.add('active', 'text-indigo-700', 'border-indigo-600');
}

// PDF RENDERER (Modified)
function uploadPDF() {
    const title = document.getElementById('pdf-title').value;
    const fileInput = document.getElementById('pdf-file');
    const file = fileInput.files[0];
    if (!title || !file) return alert("Fill all PDF fields!");

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedMaterials.unshift({ title, data: e.target.result, date: new Date().toLocaleDateString() });
        localStorage.setItem('masasa_materials', JSON.stringify(uploadedMaterials));
        renderMaterials();
        alert("Lesson Uploaded!");
    };
    reader.readAsDataURL(file);
}

function renderMaterials() {
    const container = document.getElementById('lessons-section');
    container.innerHTML = uploadedMaterials.map((m, idx) => `
        <div class="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-white hover:scale-105 transition-transform">
            <h4 class="font-black text-lg mb-4">${m.title}</h4>
            <button onclick="openPDF('${m.data}')" class="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold mb-2">Open Lesson</button>
            ${currentRole === 'admin' ? `<button onclick="deleteMaterial(${idx})" class="text-red-400 text-xs">Delete</button>` : ''}
        </div>
    `).join('');
}
