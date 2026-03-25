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
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
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

let currentQuiz = null;
let questionsPreview = [];

// ====================== UTILITIES ======================
function updateLiveTime() {
  const timeEl = document.getElementById('live-time');
  if (!timeEl) return;
  setInterval(() => timeEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }), 1000);
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

// ====================== GOOGLE SIGN-IN (Best for GitHub Pages + Mobile) ======================
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    alert("Google sign-in failed: " + error.message);
  }
}

// Handle result after redirect
async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      const user = result.user;
      document.getElementById('role-overlay').classList.add('hidden');
      document.getElementById('main-header').classList.remove('hidden');
      document.getElementById('main-content').classList.remove('hidden');

      if (user.email === 'realmasasa@gmail.com') {
        document.getElementById('admin-tools').classList.remove('hidden');
        alert(`✅ Welcome Admin - ${user.displayName || user.email}`);
      } else {
        alert(`✅ Welcome ${user.displayName || user.email} (Student)`);
      }
      loadAllContent();
    }
  } catch (error) {
    console.error(error);
    if (error.code !== 'auth/redirect-cancelled-by-user') {
      alert("Sign-in error: " + error.message);
    }
  }
}

// ====================== EMAIL ADMIN LOGIN ======================
async function validateAdmin() {
  const pass = document.getElementById('admin-pass').value.trim();
  if (!pass) return alert('Please enter password');

  try {
    await signInWithEmailAndPassword(auth, 'realmasasa@gmail.com', pass);
    document.getElementById('role-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('admin-tools').classList.remove('hidden');
    loadAllContent();
    alert('✅ Admin login successful!');
  } catch (error) {
    if (error.code === 'auth/wrong-password') alert('Wrong password!');
    else if (error.code.includes('user-not-found')) {
      document.getElementById('create-admin-section').classList.remove('hidden');
      alert('Admin account not found. Use the Create button.');
    } else alert('Login failed: ' + error.message);
  }
}

async function createAdminAccount() {
  const password = prompt("Enter strong password (min 6 chars):");
  if (!password || password.length < 6) return alert("Password too short");
  try {
    await createUserWithEmailAndPassword(auth, 'realmasasa@gmail.com', password);
    alert('✅ Admin account created! Now login with email/password.');
    document.getElementById('create-admin-section').classList.add('hidden');
  } catch (error) {
    alert('Create failed: ' + error.message);
  }
}

function selectRole(role) {
  document.getElementById('role-overlay').classList.add('hidden');
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  if (role === 'student') loadAllContent();
}

function showAdminLogin() { document.getElementById('admin-login').classList.remove('hidden'); }
function hideAdminLogin() { document.getElementById('admin-login').classList.add('hidden'); }
function logout() { signOut(auth).then(() => location.reload()); }

// ====================== REST OF YOUR FUNCTIONS (Materials, Quiz, etc.) ======================
// (Keep all the functions from previous version: uploadPDF, addQuestion, renderQuestionsPreview, 
// removeQuestion, publishQuiz, loadMaterials, viewPDF, closePDF, loadQuizzes, startQuiz, 
// renderQuizQuestions, submitQuiz, closeQuiz, loadAllContent)

// ... paste all remaining functions here from your previous index.js ...

// ====================== INIT ======================
window.onload = () => {
  updateLiveTime();
  startCountdowns();
  handleRedirectResult();   // Crucial for GitHub Pages redirect

  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById('role-overlay').classList.add('hidden');
      document.getElementById('main-header').classList.remove('hidden');
      document.getElementById('main-content').classList.remove('hidden');
      if (user.email === 'realmasasa@gmail.com') {
        document.getElementById('admin-tools').classList.remove('hidden');
      }
      loadAllContent();
    }
  });
};

// Global exposure
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
window.signInWithGoogle = signInWithGoogle;
