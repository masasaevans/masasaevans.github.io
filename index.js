// ================== FIREBASE CONFIG ==================
// PASTE YOUR CONFIG HERE (from Firebase console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

let currentUserRole = null;
let currentAdmin = null;
let currentQuiz = null;
let currentAnswers = {};
let questionsPreview = [];

// Live clock
function updateLiveTime() {
  const timeEl = document.getElementById('live-time');
  setInterval(() => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }, 1000);
}

// Select role
function selectRole(role) {
  currentUserRole = role;
  document.getElementById('role-overlay').classList.add('hidden');
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  if (role === 'student') loadAllContent();
}

// Admin login
async function validateAdmin() {
  const pass = document.getElementById('admin-pass').value;
  try {
    const userCred = await auth.signInWithEmailAndPassword('admin@masasa.online', pass);
    currentAdmin = userCred.user;
    document.getElementById('role-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('admin-tools').classList.remove('hidden');
    loadAllContent();
  } catch (e) {
    alert('Wrong password! Use the password you set in Firebase Authentication.');
  }
}

function showAdminLogin() { document.getElementById('admin-login').classList.remove('hidden'); }
function hideAdminLogin() { document.getElementById('admin-login').classList.add('hidden'); }

// Logout
function logout() {
  auth.signOut();
  location.reload();
}

// Upload PDF
async function uploadPDF() {
  const title = document.getElementById('pdf-title').value.trim();
  const deadlineInput = document.getElementById('pdf-deadline').value;
  const fileInput = document.getElementById('pdf-file');

  if (!title || !fileInput.files[0]) return alert('Title and PDF required');

  const file = fileInput.files[0];
  const storageRef = storage.ref('pdfs/' + Date.now() + '-' + file.name);

  try {
    const snapshot = await storageRef.put(file);
    const url = await snapshot.ref.getDownloadURL();

    await db.collection('materials').add({
      title: title,
      url: url,
      uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
      deadline: deadlineInput ? firebase.firestore.Timestamp.fromDate(new Date(deadlineInput)) : null
    });

    alert('✅ PDF published!');
    document.getElementById('pdf-title').value = '';
    document.getElementById('pdf-file').value = '';
    loadMaterials();
  } catch (err) {
    console.error(err);
    alert('Upload failed');
  }
}

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const analytics = getAnalytics(app);
</script>

// Add question to preview (quiz creator)
function addQuestion() {
  const type = document.getElementById('q-type').value;
  const text = document.getElementById('q-text').value.trim();

  if (!text) return alert('Enter question text');

  let question = { type, text };

  if (type === 'mcq') {
    const opts = [
      document.getElementById('opt1').value.trim(),
      document.getElementById('opt2').value.trim(),
      document.getElementById('opt3').value.trim(),
      document.getElementById('opt4').value.trim()
    ];
    const correctIndex = parseInt(document.getElementById('correct-index').value);
    question.options = opts.filter(o => o !== '');
    question.correct = correctIndex;
  } else {
    question.correct = ''; // will be set later? No, for short answer we need correct text
    // For short answer we will add a field below in UI but for simplicity we ask correct answer now
    const correctAnswer = prompt('Enter the exact correct short answer (case insensitive):');
    if (!correctAnswer) return;
    question.correct = correctAnswer.trim();
  }

  questionsPreview.push(question);
  renderQuestionsPreview();
  
  // Clear form
  document.getElementById('q-text').value = '';
  if (type === 'mcq') {
    document.getElementById('opt1').value = '';
    document.getElementById('opt2').value = '';
    document.getElementById('opt3').value = '';
    document.getElementById('opt4').value = '';
  }
}

function renderQuestionsPreview() {
  const container = document.getElementById('questions-preview');
  container.innerHTML = questionsPreview.map((q, i) => `
    <div class="flex justify-between items-center bg-white p-3 rounded-2xl text-sm">
      <div>
        <span class="font-bold uppercase text-xs">${q.type}</span> ${q.text}
        ${q.options ? `<br><small class="text-green-600">Options: ${q.options.join(' | ')}</small>` : ''}
      </div>
      <button onclick="removeQuestion(${i})" class="text-red-500 text-xl">×</button>
    </div>
  `).join('');
}

function removeQuestion(i) {
  questionsPreview.splice(i, 1);
  renderQuestionsPreview();
}

// Publish Quiz
async function publishQuiz() {
  const title = document.getElementById('quiz-title').value.trim();
  const deadlineInput = document.getElementById('quiz-deadline').value;

  if (!title || questionsPreview.length === 0) return alert('Title and at least one question required');

  try {
    await db.collection('quizzes').add({
      title: title,
      questions: questionsPreview,
      deadline: deadlineInput ? firebase.firestore.Timestamp.fromDate(new Date(deadlineInput)) : null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert('✅ Quiz published!');
    questionsPreview = [];
    renderQuestionsPreview();
    document.getElementById('quiz-title').value = '';
    loadQuizzes();
  } catch (err) {
    console.error(err);
    alert('Failed to publish quiz');
  }
}

// Load Materials (PDFs)
async function loadMaterials() {
  const snapshot = await db.collection('materials').orderBy('uploadedAt', 'desc').get();
  const container = document.getElementById('material-list');
  container.innerHTML = '';

  snapshot.forEach(doc => {
    const m = doc.data();
    const deadline = m.deadline ? m.deadline.toDate() : null;
    const expired = deadline && new Date() > deadline;

    const card = document.createElement('div');
    card.className = `bg-white p-6 rounded-3xl border-2 ${expired ? 'border-red-300 opacity-75' : 'border-indigo-100'} shadow`;
    card.innerHTML = `
      <h4 class="font-black text-lg mb-1">${m.title}</h4>
      <p class="text-xs text-slate-500">Uploaded: ${m.uploadedAt ? m.uploadedAt.toDate().toLocaleDateString() : '—'}</p>
      ${deadline ? `<p class="text-xs mt-2 \( {expired ? 'text-red-500' : 'text-orange-500'}">⏳ Deadline: <span class="countdown" data-deadline=" \){deadline.getTime()}"></span></p>` : ''}
      <button onclick="viewPDF('\( {m.url}', ' \){m.title}')" class="mt-4 w-full ${expired ? 'bg-red-400' : 'bg-indigo-600'} text-white py-3 rounded-2xl font-black">View PDF 📄</button>
    `;
    container.appendChild(card);
  });
}

// View PDF in modal
function viewPDF(url, title) {
  document.getElementById('pdf-modal-title').textContent = title;
  document.getElementById('pdf-frame').src = url;
  document.getElementById('pdf-modal').classList.remove('hidden');
}

function closePDF() {
  document.getElementById('pdf-modal').classList.add('hidden');
  document.getElementById('pdf-frame').src = '';
}

// Load Quizzes
async function loadQuizzes() {
  const snapshot = await db.collection('quizzes').orderBy('createdAt', 'desc').get();
  const container = document.getElementById('quiz-list');
  container.innerHTML = '';

  snapshot.forEach(doc => {
    const q = doc.data();
    const deadline = q.deadline ? q.deadline.toDate() : null;
    const expired = deadline && new Date() > deadline;

    const card = document.createElement('div');
    card.className = `bg-white p-6 rounded-3xl border-2 ${expired ? 'border-red-300' : 'border-orange-100'} shadow`;
    card.innerHTML = `
      <h4 class="font-black text-lg mb-1">${q.title}</h4>
      <p class="text-xs text-slate-500">${q.questions.length} questions</p>
      ${deadline ? `<p class="text-xs mt-2 \( {expired ? 'text-red-500' : 'text-orange-500'}">⏳ Deadline: <span class="countdown" data-deadline=" \){deadline.getTime()}"></span></p>` : ''}
      <button onclick="startQuiz('${doc.id}')" class="mt-4 w-full ${expired ? 'bg-red-400 cursor-not-allowed' : 'bg-orange-500'} text-white py-3 rounded-2xl font-black" ${expired ? 'disabled' : ''}>
        ${expired ? 'EXPIRED' : 'START QUIZ NOW'}
      </button>
    `;
    container.appendChild(card);
  });
}

// Start a quiz
async function startQuiz(quizId) {
  const doc = await db.collection('quizzes').doc(quizId).get();
  currentQuiz = { id: quizId, ...doc.data() };
  currentAnswers = {};

  document.getElementById('quiz-area').classList.remove('hidden');
  document.getElementById('quiz-area').innerHTML = `
    <h2 class="text-3xl font-black text-center mb-8">${currentQuiz.title}</h2>
    <div id="questions-container" class="space-y-10"></div>
    <button onclick="submitQuiz()" class="w-full mt-10 bg-green-600 text-white py-6 rounded-3xl text-2xl font-black">FINISH &amp; GET INSTANT RESULT</button>
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
                <input type="radio" name="q\( {index}" value=" \){i}" class="w-5 h-5">
                <span class="text-lg">${opt}</span>
              </label>
            `).join('')}
          </div>
        </div>`;
    } else {
      return `
        <div class="bg-white p-8 rounded-3xl shadow">
          <p class="font-bold text-xl mb-6">${index + 1}. ${q.text}</p>
          <input type="text" id="short-${index}" placeholder="Type your answer here" class="w-full p-5 border-2 border-orange-200 rounded-3xl text-lg outline-none focus:border-orange-400">
        </div>`;
    }
  }).join('');
}

// Submit quiz → instant marking
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

  // Hide quiz area after submit
  document.getElementById('quiz-area').classList.add('hidden');
}

function closeQuiz() {
  document.getElementById('score-modal').classList.add('hidden');
  currentQuiz = null;
}

// Load everything for learners
function loadAllContent() {
  loadMaterials();
  loadQuizzes();
}

// Countdown updater
function startCountdowns() {
  setInterval(() => {
    document.querySelectorAll('.countdown').forEach(el => {
      const deadline = parseInt(el.getAttribute('data-deadline'));
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
  }, 60000);
}

// Init everything
window.onload = () => {
  updateLiveTime();
  startCountdowns();
  // Listen for auth state (in case admin refreshes)
  auth.onAuthStateChanged(user => {
    if (user && user.email === 'admin@masasa.online') {
      currentAdmin = user;
    }
  });
};
