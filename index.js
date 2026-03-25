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
  signInWithPopup,        // ← Changed from Redirect
  // signInWithRedirect,  // ← Commented out
  // getRedirectResult,   // ← No longer needed
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

// ====================== GOOGLE SIGN-IN (Popup - Best for Mobile + GitHub Pages) ======================
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ 
    prompt: 'select_account'   // Shows account chooser every time (good for testing multiple accounts)
  });

  const btn = document.getElementById('google-btn'); // Add id="google-btn" to your Google button if needed
  if (btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Connecting to Google...";
  }

  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Google sign-in successful:", result.user.email);
    showMainApp(result.user);
  } catch (error) {
    console.error("Google sign-in error:", error);
    let msg = "Google sign-in failed";
    if (error.code === 'auth/popup-blocked') msg = "Popup was blocked. Please allow popups for this site.";
    else if (error.code === 'auth/cancelled-popup-request') msg = "Sign-in cancelled.";
    else if (error.code === 'auth/unauthorized-domain') msg = "Domain not authorized. Check Firebase settings.";
    
    alert(msg + "\n\nError: " + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText || "Sign in with Google";
    }
  }
}

// ====================== EMAIL/PASSWORD AUTH (unchanged) ======================
let isLoginMode = true;

function toggleAuthMode() { /* your existing code */ }

async function handleEmailAuth() { /* your existing code */ }

function showMainApp(user) {
  document.getElementById('role-overlay').classList.add('hidden');
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');

  if (user.email === 'realmasasa@gmail.com') {
    document.getElementById('admin-tools').classList.remove('hidden');
  }
  loadAllContent();
}

// ====================== LOGOUT ======================
function logout() {
  signOut(auth).then(() => {
    location.reload();   // Full reload ensures clean state on all devices
  }).catch(err => console.error(err));
}

// ====================== INIT ======================
window.onload = () => {
  updateLiveTime();
  startCountdowns();

  // Reliable auth state listener (works on every device & after popup)
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User logged in (onAuthStateChanged):", user.email);
      showMainApp(user);
    } else {
      console.log("No user logged in");
      // Optionally show login screen here if needed
    }
  });

  // Expose functions
  window.signInWithGoogle = signInWithGoogle;
  window.continueAsStudent = continueAsStudent;
  window.logout = logout;
  window.handleEmailAuth = handleEmailAuth;
  window.toggleAuthMode = toggleAuthMode;

  // ... your other window. assignments
};
