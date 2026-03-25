import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// ===== CONFIG =====
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

// ===== ELEMENTS =====
const roleOverlay = document.getElementById("role-overlay");
const mainHeader = document.getElementById("main-header");
const mainContent = document.getElementById("main-content");
const adminTools = document.getElementById("admin-tools");
const quizArea = document.getElementById("quiz-area");

// ===== Show main app (student or admin) =====
function showMain(isAdmin = false) {
  roleOverlay.classList.add("hidden");
  mainHeader.classList.remove("hidden");
  mainContent.classList.remove("hidden");

  if (isAdmin) {
    adminTools.classList.remove("hidden");
  } else {
    adminTools.classList.add("hidden");
  }
}

// ===== Listen to auth state (this fixes the Google login issue) =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    const isAdmin = user.email === "realmasasa@gmail.com";
    showMain(isAdmin);
    loadMaterials();
    loadQuizzes();
  } else {
    // No user signed in → show role overlay
    roleOverlay.classList.remove("hidden");
    mainHeader.classList.add("hidden");
    mainContent.classList.add("hidden");
    adminTools.classList.add("hidden");
  }
});

// ===== STUDENT ROLE (Continue as Student) =====
window.selectRole = () => {
  // For guest/student without real auth, we just show the main area
  showMain(false);
  loadMaterials();
  loadQuizzes();
};

// ===== ADMIN LOGIN =====
window.showAdminLogin = () => document.getElementById("admin-login").classList.remove("hidden");
window.hideAdminLogin = () => document.getElementById("admin-login").classList.add("hidden");

window.validateAdmin = async () => {
  const pass = document.getElementById("admin-pass").value;
  try {
    await signInWithEmailAndPassword(auth, "realmasasa@gmail.com", pass);
    // onAuthStateChanged will handle showing the UI
    alert("Admin login successful ✅");
  } catch (err) {
    alert("Admin login failed ❌\n" + err.message);
  }
};

// ===== GOOGLE LOGIN =====
window.signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    // No need to call showMain() here — onAuthStateChanged will do it automatically
    // alert is kept so user sees success
  } catch (err) {
    alert("Google login failed ❌\n" + err.message);
  }
};

// ===== LOGOUT =====
window.logout = () => {
  signOut(auth).then(() => {
    // onAuthStateChanged will handle returning to overlay
  });
};

// ===== ADMIN BUTTONS =====
document.getElementById("upload-pdf-btn").addEventListener("click", uploadPDF);
document.getElementById("add-question-btn").addEventListener("click", addQuestion);
document.getElementById("publish-quiz-btn").addEventListener("click", publishQuiz);

// ===== UPLOAD PDF =====
async function uploadPDF() {
  const title = document.getElementById("pdf-title").value.trim();
  const file = document.getElementById("pdf-file").files[0];
  if (!title) return alert("Please enter a title");
  if (!file) return alert("Please select a PDF");

  const storageRef = ref(storage, "materials/" + Date.now() + "-" + file.name);
  try {
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, "materials"), { title, url, created: Date.now() });
    alert("PDF uploaded successfully ✅");
    loadMaterials();
  } catch (err) {
    alert("Upload failed ❌\n" + err.message);
  }
}

// ===== LOAD MATERIALS =====
async function loadMaterials() {
  const list = document.getElementById("material-list");
  list.innerHTML = "<p class='text-gray-500'>Loading materials...</p>";
  try {
    const q = query(collection(db, "materials"), orderBy("created", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = "<p class='text-gray-500'>No materials yet.</p>";
      return;
    }
    snap.forEach(doc => {
      const m = doc.data();
      list.innerHTML += `
        <div class="card p-4">
          📄 <strong>${m.title}</strong><br>
          <a href="${m.url}" target="_blank" class="text-orange-600 underline">Download PDF</a>
        </div>`;
    });
  } catch (err) {
    list.innerHTML = "<p class='text-red-500'>Failed to load materials</p>";
  }
}

// ===== QUIZ SYSTEM =====
let questions = [];

function addQuestion() {
  questions.push({
    q: "What is the capital of Kenya?",
    options: ["Nairobi", "Mombasa", "Kisumu", "Eldoret"],
    correct: 0
  });
  alert("Sample question added! (You can extend this later)");
}

async function publishQuiz() {
  const title = document.getElementById("quiz-title").value.trim();
  if (!title) return alert("Please enter quiz title");
  if (questions.length === 0) return alert("Add at least one question");

  try {
    await addDoc(collection(db, "quizzes"), { title, questions, created: Date.now() });
    questions = [];
    document.getElementById("quiz-title").value = "";
    alert("Quiz published successfully ✅");
    loadQuizzes();
  } catch (err) {
    alert("Failed to publish quiz ❌\n" + err.message);
  }
}

// ===== LOAD QUIZZES =====
async function loadQuizzes() {
  const list = document.getElementById("quiz-list");
  list.innerHTML = "<p class='text-gray-500'>Loading quizzes...</p>";
  try {
    const snap = await getDocs(collection(db, "quizzes"));
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = "<p class='text-gray-500'>No quizzes yet.</p>";
      return;
    }
    snap.forEach(doc => {
      const quiz = doc.data();
      list.innerHTML += `
        <div class="card p-4">
          🧠 <strong>${quiz.title}</strong><br>
          <button onclick="startQuiz('${doc.id}')" 
                  class="mt-2 bg-orange-500 text-white px-5 py-2 rounded-xl text-sm">
            Start Quiz
          </button>
        </div>`;
    });
  } catch (err) {
    list.innerHTML = "<p class='text-red-500'>Failed to load quizzes</p>";
  }
}

// ===== START QUIZ =====
window.startQuiz = async (id) => {
  try {
    const snap = await getDocs(collection(db, "quizzes"));
    const quizDoc = snap.docs.find(d => d.id === id);
    if (!quizDoc) return alert("Quiz not found");

    const quiz = quizDoc.data();
    quizArea.classList.remove("hidden");
    let html = `<h2 class="text-2xl font-black mb-6">${quiz.title}</h2>`;

    quiz.questions.forEach((q, i) => {
      html += `<div class="mb-8">
        <p class="font-bold text-lg">${i + 1}. ${q.q}</p>`;
      q.options.forEach((opt, j) => {
        html += `
          <label class="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="radio" name="q\( {i}" value=" \){j}" class="w-5 h-5">
            <span>${opt}</span>
          </label>`;
      });
      html += `</div>`;
    });

    html += `<button onclick="submitQuiz()" class="mt-6 bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-2xl font-bold text-lg">Submit Answers</button>`;
    quizArea.innerHTML = html;
  } catch (err) {
    alert("Failed to load quiz");
  }
};

window.submitQuiz = () => {
  alert("✅ Quiz submitted! (Scoring will be added later)");
};

// ===== LIVE TIME =====
setInterval(() => {
  const el = document.getElementById("live-time");
  if (el) el.textContent = new Date().toLocaleString("en-GB");
}, 1000);
