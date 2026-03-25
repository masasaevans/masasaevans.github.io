// ================== FIREBASE CONFIG ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, orderBy, query, doc, getDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_HOU827BDT-QRDJMJU0QBF1GznxuT3rM",
  authDomain: "masasa-online.firebaseapp.com",
  projectId: "masasa-online",
  storageBucket: "masasa-online.firebasestorage.app",
  messagingSenderId: "975253887376",
  appId: "1:975253887376:web:c1d6e59922a7d3ac2cbb15",
  measurementId: "G-LLPYLLVV8V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

let currentUserRole = null;
let currentQuiz = null;
let questionsPreview = [];

// ====================== UTILITIES ======================
function updateLiveTime() {
  const timeEl = document.getElementById('live-time');
  if (!timeEl) return;
  setInterval(() => {
    timeEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }, 1000);
}

function startCountdowns() {
  setInterval(() => {
    document.querySelectorAll('.countdown').forEach(el => {
      const deadline = parseInt(el.getAttribute('data-deadline'));
      if (!deadline) return;
      const diff = deadline - Date.now();
      if (diff <= 0) {
        el.textContent = 'EXPIRED';
        el.classList.add('text-red-500');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        el.textContent = `${hours}h ${minutes}m left`;
      }
    });
  }, 30000);
}

// ====================== ROLE & AUTH ======================
function selectRole(role) {
  currentUserRole = role;
  document.getElementById('role-overlay').classList.add('hidden');
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  if (role === 'student') loadAllContent();
}

async function validateAdmin() {
  const pass = document.getElementById('admin-pass').value.trim();
  if (!pass) return alert('Please enter password');

  try {
    await signInWithEmailAndPassword(auth, 'realmasasa@gmail.com', pass);
    
    document.getElementById('role-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('admin-tools').classList.remove('hidden');
    document.getElementById('create-admin-section').classList.add('hidden');
    
    loadAllContent();
    alert('✅ Admin login successful!');
  } catch (error) {
    console.error("Login error:", error.code, error.message);
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      document.getElementById('create-admin-section').classList.remove('hidden');
      alert('Admin account not found. Use the "Create Admin Account" button.');
    } else if (error.code === 'auth/wrong-password') {
      alert('Wrong password! Please try again.');
    } else {
      alert('Login failed: ' + error.message);
    }
  }
}

async function createAdminAccount() {
  const password = prompt("Enter a strong password for admin (minimum 6 characters):");
  if (!password || password.length < 6) {
    return alert("Password must be at least 6 characters long.");
  }

  try {
    await createUserWithEmailAndPassword(auth, 'realmasasa@gmail.com', password);
    alert(`✅ Admin account created!\n\nEmail: realmasasa@gmail.com\nPassword: ${password}\n\nYou can now login.`);
    document.getElementById('create-admin-section').classList.add('hidden');
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      alert('Account already exists. Try logging in with the correct password.');
      document.getElementById('create-admin-section').classList.add('hidden');
    } else {
      alert('Failed to create account: ' + error.message);
    }
  }
}

function showAdminLogin() { 
  document.getElementById('admin-login').classList.remove('hidden'); 
}

function hideAdminLogin() { 
  document.getElementById('admin-login').classList.add('hidden'); 
}

function logout() {
  signOut(auth).then(() => location.reload());
}

// ====================== MATERIALS ======================
async function uploadPDF() {
  const title = document.getElementById('pdf-title').value.trim();
  const deadlineInput = document.getElementById('pdf-deadline').value;
  const file = document.getElementById('pdf-file').files[0];

  if (!title || !file) return alert('Title and PDF file required');

  try {
    const storageRef = ref(storage, 'pdfs/' + Date.now() + '-' + file.name);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'materials'), {
      title,
      url,
      uploadedAt: serverTimestamp(),
      deadline: deadlineInput ? new Date(deadlineInput) : null
    });

    alert('✅ PDF published successfully!');
    document.getElementById('pdf-title').value = '';
    document.getElementById('pdf-file').value = '';
    loadMaterials();
  } catch (err) {
    console.error(err);
    alert('Upload failed: ' + err.message);
  }
}

// ====================== QUIZ CREATION ======================
function addQuestion() {
  const type = document.getElementById('q-type').value;
  const text = document.getElementById('q-text').value.trim();
  if (!text) return alert('Enter question text');

  let question = { type, text };

  if (type === 'mcq') {
    const opts = ['opt1','opt2','opt3','opt4']
      .map(id => document.getElementById(id).value.trim())
      .filter(o => o);

    const correctIndex = parseInt(document.getElementById('correct-index').value);

    if (opts.length < 2 || isNaN(correctIndex) || correctIndex >= opts.length) {
      return alert('At least 2 options and valid correct index required');
    }

    question.options = opts;
    question.correct = correctIndex;
  } else {
    const correctAnswer = prompt('Enter exact correct short answer (case insensitive):');
    if (!correctAnswer?.trim()) return;
    question.correct = correctAnswer.trim();
  }

  questionsPreview.push(question);
  renderQuestionsPreview();

  document.getElementById('q-text').value = '';
  if (type === 'mcq') {
    ['opt1','opt2','opt3','opt4'].forEach(id => document.getElementById(id).value = '');
  }
}

function renderQuestionsPreview() {
  const container = document.getElementById('questions-preview');
  container.innerHTML = questionsPreview.map((q, i) => `
    <div class="flex justify-between bg-white p-4 rounded-2xl border">
      <div>
        <span class="uppercase text-xs font-bold text-orange-600">${q.type}</span> ${q.text}
        ${q.options ? `<br><small class="text-green-600">Options: ${q.options.join(' | ')}</small>` : ''}
      </div>
      <button onclick="removeQuestion(${i})" class="text-red-500 text-2xl">×</button>
    </div>
  `).join('');
}

function removeQuestion(i) {
  questionsPreview.splice(i, 1);
  renderQuestionsPreview();
}

async function publishQuiz() {
  const title = document.getElementById('quiz-title').value.trim();
  const deadlineInput = document.getElementById('quiz-deadline').value;

  if (!title || questionsPreview.length === 0) return alert('Title and at least one question required');

  try {
    await addDoc(collection(db, 'quizzes'), {
      title,
      questions: questionsPreview,
      deadline: deadlineInput ? new Date(deadlineInput) : null,
      createdAt: serverTimestamp()
    });

    alert('✅ Quiz published successfully!');
    questionsPreview = [];
    renderQuestionsPreview();
    document.getElementById('quiz-title').value = '';
    loadQuizzes();
  } catch (err) {
    console.error(err);
    alert('Failed to publish quiz');
  }
}

// ====================== LOAD CONTENT ======================
async function loadMaterials() {
  const q = query(collection(db, 'materials'), orderBy('uploadedAt', 'desc'));
  const snapshot = await getDocs(q);
  const container = document.getElementById('material-list');
  container.innerHTML = '';

  snapshot.forEach(docSnap => {
    const m = docSnap.data();
    const deadline = m.deadline ? new Date(m.deadline) : null;
    const expired = deadline && Date.now() > deadline.getTime();

    const cardHTML = `
      <div class="bg-white p-6 rounded-3xl border-2 shadow ${expired ? 'border-red-300 opacity-75' : 'border-indigo-100'}">
        <h4 class="font-black text-lg">${m.title}</h4>
        <p class="text-xs text-slate-500">Uploaded: ${m.uploadedAt?.toDate ? m.uploadedAt.toDate().toLocaleDateString() : '—'}</p>
        ${deadline ? `<p class="text-xs mt-2 \( {expired ? 'text-red-500' : 'text-orange-500'}">⏳ Deadline: <span class="countdown" data-deadline=" \){deadline.getTime()}"></span></p>` : ''}
        <button onclick="viewPDF('\( {m.url}', ' \){m.title.replace(/'/g, "\\'")}')" 
                class="mt-4 w-full ${expired ? 'bg-red-400' : 'bg-indigo-600'} text-white py-3 rounded-2xl font-black">
          View PDF 📄
        </button>
      </div>`;
    container.innerHTML += cardHTML;
  });
}

function viewPDF(url, title) {
  document.getElementById('pdf-modal-title').textContent = title;
  document.getElementById('pdf-frame').src = url;
  document.getElementById('pdf-modal').classList.remove('hidden');
}

function closePDF() {
  document.getElementById('pdf-modal').classList.add('hidden');
  document.getElementById('pdf-frame').src = '';
}

async function loadQuizzes() {
  const q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const container = document.getElementById('quiz-list');
  container.innerHTML = '';

  snapshot.forEach(docSnap => {
    const quiz = docSnap.data();
    const deadline = quiz.deadline ? new Date(quiz.deadline) : null;
    const expired = deadline && Date.now() > deadline.getTime();

    const cardHTML = `
      <div class="bg-white p-6 rounded-3xl border-2 shadow ${expired ? 'border-red-300' : 'border-orange-100'}">
        <h4 class="font-black text-lg">${quiz.title}</h4>
        <p class="text-xs text-slate-500">${quiz.questions.length} questions</p>
        ${deadline ? `<p class="text-xs mt-2 \( {expired ? 'text-red-500' : 'text-orange-500'}">⏳ Deadline: <span class="countdown" data-deadline=" \){deadline.getTime()}"></span></p>` : ''}
        <button onclick="startQuiz('${docSnap.id}')" 
                class="mt-4 w-full ${expired ? 'bg-red-400 cursor-not-allowed' : 'bg-orange-500'} text-white py-3 rounded-2xl font-black"
                ${expired ? 'disabled' : ''}>
          ${expired ? 'EXPIRED' : 'START QUIZ NOW'}
        </button>
      </div>`;
    container.innerHTML += cardHTML;
  });
}

// ====================== TAKE QUIZ ======================
async function startQuiz(quizId) {
  const docSnap = await getDoc(doc(db, 'quizzes', quizId));
  if (!docSnap.exists()) return alert("Quiz not found");

  currentQuiz = { id: quizId, ...docSnap.data() };

  document.getElementById('quiz-area').classList.remove('hidden');
  document.getElementById('quiz-area').innerHTML = `
    <h2 class="text-3xl font-black text-center mb-8">${currentQuiz.title}</h2>
    <div id="questions-container" class="space-y-10"></div>
    <button onclick="submitQuiz()" class="w-full mt-10 bg-green-600 hover:bg-green-700 text-white py-6 rounded-3xl text-2xl font-black">
      FINISH & GET INSTANT RESULT
    </button>
  `;

  renderQuizQuestions();
}

function renderQuizQuestions() {
  const container = document.getElementById('questions-container');
  container.innerHTML = currentQuiz.questions.map((q, index) => {
    if (q.type === 'mcq') {
      return `
        <div class="bg-white p-8 rounded-3xl shadow">
          <p class="font-bold text-xl mb-6">${index + 1}. ${q.text}</p>
          <div class="space-y-4">
            ${q.options.map((opt, i) => `
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="q\( {index}" value=" \){i}" class="w-5 h-5 accent-orange-500">
                <span class="text-lg">${opt}</span>
              </label>
            `).join('')}
          </div>
        </div>`;
    } else {
      return `
        <div class="bg-white p-8 rounded-3xl shadow">
          <p class="font-bold text-xl mb-6">${index + 1}. ${q.text}</p>
          <input type="text" id="short-${index}" placeholder="Type your answer here..." 
                 class="w-full p-5 border-2 border-orange-200 rounded-3xl text-lg focus:border-orange-500">
        </div>`;
    }
  }).join('');
}

function submitQuiz() {
  let score = 0;
  const total = currentQuiz.questions.length;

  currentQuiz.questions.forEach((q, index) => {
    if (q.type === 'mcq') {
      const selected = document.querySelector(`input[name="q${index}"]:checked`);
      if (selected && parseInt(selected.value) === q.correct) score++;
    } else {
      const answer = document.getElementById(`short-${index}`).value.trim().toLowerCase();
      if (answer === q.correct.toLowerCase()) score++;
    }
  });

  const percent = Math.round((score / total) * 100);
  const emoji = percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '😕';
  const feedback = percent >= 80 ? 'Excellent work!' : percent >= 50 ? 'Good effort!' : 'Keep practicing!';

  document.getElementById('score-emoji').textContent = emoji;
  document.getElementById('final-percent').textContent = percent + '%';
  document.getElementById('score-feedback').textContent = feedback;
  document.getElementById('score-modal').classList.remove('hidden');

  document.getElementById('quiz-area').classList.add('hidden');
}

function closeQuiz() {
  document.getElementById('score-modal').classList.add('hidden');
  currentQuiz = null;
}

function loadAllContent() {
  loadMaterials();
  loadQuizzes();
}

// ====================== INIT ======================
window.onload = () => {
  updateLiveTime();
  startCountdowns();

  onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'realmasasa@gmail.com') {
      document.getElementById('admin-tools').classList.remove('hidden');
      document.getElementById('create-admin-section').classList.add('hidden');
    }
  });
};

// Make functions available globally
window.selectRole = selectRole;
window.validateAdmin = validateAdmin;
window.createAdminAccount = createAdminAccount;
window.showAdminLogin = showAdminLogin;
window.hideAdminLogin = hideAdminLogin;
window.logout = logout;
window.uploadPDF = uploadPDF;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.publishQuiz = publishQuiz;
window.viewPDF = viewPDF;
window.closePDF = closePDF;
window.startQuiz = startQuiz;
window.submitQuiz = submitQuiz;
window.closeQuiz = closeQuiz;
