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
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
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

// ====================== GOOGLE SIGN-IN ======================
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    alert("Google sign-in failed: " + error.message);
  }
}

async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      showMainApp(result.user);
    }
  } catch (error) {
    console.error("Redirect error:", error);
    alert("Google sign-in error: " + error.message);
  }
}

// ====================== EMAIL/PASSWORD AUTH (Fixed) ======================
let isLoginMode = true;   // true = sign in, false = sign up

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById('auth-title').textContent = isLoginMode ? 'Sign In' : 'Create Account';
  document.getElementById('auth-button').textContent = isLoginMode ? 'Sign In' : 'Sign Up';
  document.getElementById('toggle-text').innerHTML = isLoginMode 
    ? `Don't have an account? <span onclick="toggleAuthMode()" class="text-orange-600 cursor-pointer">Sign up</span>` 
    : `Already have an account? <span onclick="toggleAuthMode()" class="text-orange-600 cursor-pointer">Sign in</span>`;
}

async function handleEmailAuth() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  const btn = document.getElementById('auth-button');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Please wait...";

  try {
    let userCredential;
    if (isLoginMode) {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    }
    showMainApp(userCredential.user);
  } catch (error) {
    console.error(error);
    let msg = error.message;
    if (error.code === 'auth/wrong-password') msg = "Incorrect password";
    else if (error.code === 'auth/user-not-found') msg = "No account found with this email";
    else if (error.code === 'auth/email-already-in-use') msg = "Email already registered. Please sign in.";
    else if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters";
    
    alert("Error: " + msg);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function showMainApp(user) {
  document.getElementById('role-overlay').classList.add('hidden');
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');

  if (user.email === 'realmasasa@gmail.com') {
    document.getElementById('admin-tools').classList.remove('hidden');
  }
  loadAllContent();
}

// ====================== DEMO & LOGOUT ======================
function continueAsStudent() {
  document.getElementById('role-overlay').classList.add('hidden');
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  loadAllContent();
}

function logout() {
  signOut(auth).then(() => location.reload());
}

// ====================== (Your existing PDF, Quiz, Load functions unchanged) ======================
// ... [Keep all your uploadPDF, addQuestion, publishQuiz, loadMaterials, loadQuizzes, startQuiz, etc. exactly as you had them] ...

// ====================== INIT ======================
window.onload = () => {
  updateLiveTime();
  startCountdowns();
  handleRedirectResult();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      showMainApp(user);
    }
  });

  // Expose functions to window so onclick works
  window.signInWithGoogle = signInWithGoogle;
  window.continueAsStudent = continueAsStudent;
  window.logout = logout;
  window.handleEmailAuth = handleEmailAuth;
  window.toggleAuthMode = toggleAuthMode;

  // ... your other window. assignments (uploadPDF, addQuestion, etc.)
};
