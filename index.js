// ================== index.js - Updated for GitHub Pages + Mobile ==================

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
  signInWithPopup,
  signInWithRedirect,
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

// ====================== GOOGLE SIGN-IN (Hybrid - Best for Smartphone + GitHub Pages) ======================
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Show loading on the Google button (add id="google-btn" to your button if possible)
  const googleBtn = document.getElementById('google-btn') || 
                    document.querySelector('button[onclick*="signInWithGoogle"]');
  let originalText = googleBtn ? googleBtn.textContent.trim() : "Sign in with Google";

  if (googleBtn) {
    googleBtn.disabled = true;
    googleBtn.textContent = "Connecting to Google...";
  }

  try {
    // 1. Try Popup first (smooth on desktop and many mobiles)
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Google sign-in successful via Popup:", result.user.email);
    showMainApp(result.user);
  } catch (error) {
    console.warn("Popup failed:", error.code);

    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/cancelled-popup-request') {

      // 2. Fallback to Redirect (more reliable on strict mobile browsers)
      console.log("↪️ Popup blocked on mobile → using redirect fallback");
      try {
        await signInWithRedirect(auth, provider);
        // Nothing more to do here – page redirects and onAuthStateChanged will catch the login
      } catch (redirectErr) {
        console.error("Redirect also failed:", redirectErr);
        alert("Google sign-in failed. Please try again or use Email/Password.\n\n" + redirectErr.message);
      }
    } 
    else if (error.code === 'auth/unauthorized-domain') {
      alert("❌ Domain not authorized!\n\nPlease add 'masasaevans.github.io' in Firebase Console → Authentication → Settings → Authorized domains");
    } 
    else {
      alert("Google sign-in error:\n" + error.message);
    }
  } finally {
    if (googleBtn) {
      googleBtn.disabled = false;
      googleBtn.textContent = originalText;
    }
  }
}

// ====================== EMAIL/PASSWORD AUTH ======================
let isLoginMode = true;

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
  loadAllContent();   // Make sure this function exists and works
}

// ====================== DEMO & LOGOUT ======================
function continueAsStudent() {
  document.getElementById('role-overlay').classList.add('hidden');
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  loadAllContent();
}

function logout() {
  signOut(auth).then(() => {
    location.reload();   // Full reload for clean state on all devices
  }).catch(err => {
    console.error("Logout error:", err);
    location.reload();
  });
}

// ====================== INIT ======================
window.onload = () => {
  updateLiveTime();
  startCountdowns();

  // Main auth listener – works for popup, redirect, email/password on all devices
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ User signed in:", user.email);
      showMainApp(user);
    } else {
      console.log("No user signed in");
    }
  });

  // Expose functions for HTML onclick handlers
  window.signInWithGoogle = signInWithGoogle;
  window.continueAsStudent = continueAsStudent;
  window.logout = logout;
  window.handleEmailAuth = handleEmailAuth;
  window.toggleAuthMode = toggleAuthMode;

  // Add your other functions here, e.g.:
  // window.uploadPDF = uploadPDF;
  // window.addQuestion = addQuestion;
  // etc.
};
