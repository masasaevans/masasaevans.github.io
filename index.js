const ADMIN_PASS = "admin123";
let currentRole = null;
let uploadedMaterials = JSON.parse(localStorage.getItem('masasa_materials')) || [];
let savedQuizzes = JSON.parse(localStorage.getItem('masasa_quizzes')) || [];
let marqueeText = localStorage.getItem('masasa_announcement') || "Welcome to Masasa Online! Check out our new lessons.";
let userAnswers = {};

// 1. INIT
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('marquee-text').textContent = marqueeText;
    fetchLocation();
    setInterval(() => {
        document.getElementById('live-time').textContent = new Date().toLocaleTimeString('en-GB');
    }, 1000);
});

// 2. LOCATION
async function fetchLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        document.getElementById('location-display').textContent = `📍 ${data.city}, ${data.country_name}`;
    } catch (e) {
        document.getElementById('location-display').textContent = `📍 Nairobi, Kenya`;
    }
}

// 3. ADMIN ACTIONS
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
        currentRole = 'admin';
        document.getElementById('admin-tools').classList.remove('hidden');
        enterPortal();
    } else { alert("Access Denied!"); }
}

function selectRole(role) {
    currentRole = role;
    enterPortal();
}

function enterPortal() {
    document.getElementById('role-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    renderMaterials();
    renderQuiz();
}

// 4. ANNOUNCEMENT & PDF
function updateAnnouncement() {
    const val = document.getElementById('ann-input').value;
    if(val) {
        localStorage.setItem('masasa_announcement', val);
        document.getElementById('marquee-text').textContent = val;
        alert("Announcement Updated! 📢");
    }
}

function uploadPDF() {
    const title = document.getElementById('pdf-title').value;
    const file = document.getElementById('pdf-file').files[0];
    if(!title || !file) return alert("Missing info!");

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedMaterials.unshift({ title, data: e.target.result, date: new Date().toLocaleDateString() });
        localStorage.setItem('masasa_materials', JSON.stringify(uploadedMaterials));
        renderMaterials();
        alert("Lesson Posted!");
    };
    reader.readAsDataURL(file);
}

// 5. QUIZ LOGIC
function saveQuiz() {
    const q = document.getElementById('quiz-q').value;
    const opts = [document.getElementById('opt-0').value, document.getElementById('opt-1').value, document.getElementById('opt-2').value];
    const correct = document.getElementById('correct-opt').value;

    if(!q || opts.includes("")) return alert("Fill all quiz parts!");

    savedQuizzes.push({ q, options: opts, correct: parseInt(correct) });
    localStorage.setItem('masasa_quizzes', JSON.stringify(savedQuizzes));
    alert("Question Added!");
    renderQuiz();
}

function renderQuiz() {
    const container = document.getElementById('quiz-display');
    if(savedQuizzes.length === 0) {
        container.innerHTML = `<p class='text-center py-10 text-slate-400'>No quiz available yet.</p>`;
        return;
    }
    container.innerHTML = savedQuizzes.map((q, idx) => `
        <div class="mb-8 p-6 bg-indigo-50 rounded-3xl">
            <h4 class="text-xl font-black mb-4">${idx+1}. ${q.q}</h4>
            <div class="flex flex-col gap-2">
                ${q.options.map((opt, oIdx) => `
                    <button onclick="pickAnswer(${idx}, ${oIdx}, this)" class="q-opt p-4 bg-white rounded-xl font-bold border-2 border-transparent">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('') + `<button onclick="gradeQuiz()" class="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-lg mt-4">GRADE MY QUIZ</button>`;
}

function pickAnswer(qIdx, oIdx, btn) {
    const buttons = btn.parentElement.querySelectorAll('.q-opt');
    buttons.forEach(b => b.style.borderColor = "transparent");
    btn.style.borderColor = "#4f46e5";
    userAnswers[qIdx] = oIdx;
}

function gradeQuiz() {
    let score = 0;
    savedQuizzes.forEach((q, i) => { if(userAnswers[i] === q.correct) score++; });
    const pct = Math.round((score / savedQuizzes.length) * 100);
    document.getElementById('final-percent').textContent = pct + "%";
    document.getElementById('score-modal').classList.remove('hidden');
}

function closeScore() { document.getElementById('score-modal').classList.add('hidden'); }

// 6. TABS
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`${tab}-section`).classList.remove('hidden');
}

function renderMaterials() {
    const list = document.getElementById('lessons-section');
    list.innerHTML = uploadedMaterials.map((m, idx) => `
        <div class="bg-white p-6 rounded-[2rem] shadow-lg border-2 border-white">
            <h4 class="font-black text-lg mb-4 truncate">${m.title}</h4>
            <a href="${m.data}" download="${m.title}.pdf" class="block w-full text-center bg-orange-500 text-white py-3 rounded-xl font-bold">Download PDF</a>
            ${currentRole === 'admin' ? `<button onclick="deleteMaterial(${idx})" class="text-red-400 text-xs block mt-2 mx-auto">Delete</button>` : ''}
        </div>
    `).join('');
}

function deleteMaterial(idx) {
    uploadedMaterials.splice(idx, 1);
    localStorage.setItem('masasa_materials', JSON.stringify(uploadedMaterials));
    renderMaterials();
}
