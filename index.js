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

// ===== CORE LOGIC =====

function showMain(isAdmin = false) {
  roleOverlay.classList.add("hidden");
  mainHeader.classList.remove("hidden");
  mainContent.classList.remove("hidden");
  if (isAdmin) adminTools.classList.remove("hidden");
  else adminTools.classList.add("hidden");
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const isAdmin = user.email === "realmasasa@gmail.com";
    showMain(isAdmin);
    loadMaterials();
    loadQuizzes();
  } else {
    roleOverlay.classList.remove("hidden");
    mainHeader.classList.add("hidden");
    mainContent.classList.add("hidden");
    adminTools.classList.add("hidden");
  }
});

// ===== MATERIALS =====

async function uploadPDF() {
  const title = document.getElementById("pdf-title").value.trim();
  const file = document.getElementById("pdf-file").files[0];
  if (!title || !file) return alert("Please enter a title and select a PDF");

  try {
    const storageRef = ref(storage, "materials/" + Date.now() + "-" + file.name);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, "materials"), { title, url, created: Date.now() });
    alert("PDF uploaded successfully ✅");
    loadMaterials();
  } catch (err) {
    alert("Upload failed: " + err.message);
  }
}

async function loadMaterials() {
  const list = document.getElementById("material-list");
  list.innerHTML = "Loading...";
  try {
    const q = query(collection(db, "materials"), orderBy("created", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(doc => {
      const m = doc.data();
      list.innerHTML += `<div class="card p-4">📄 <strong>${m.title}</strong><br><a href="${m.url}" target="_blank" class="text-orange-600 underline">Download PDF</a></div>`;
    });
  } catch (err) { list.innerHTML = "Error loading materials"; }
}

// ===== QUIZ BUILDER (ADMIN) =====

let currentQuizQuestions = [];

function addQuestionToList() {
  const qText = document.getElementById("q-text").value.trim();
  const options = [
    document.getElementById("opt-0").value.trim(),
    document.getElementById("opt-1").value.trim(),
    document.getElementById("opt-2").value.trim(),
    document.getElementById("opt-3").value.trim()
  ];
  const correctIdx = document.getElementById("q-correct").value;

  if (!qText || options.some(opt => !opt) || correctIdx === "") {
    return alert("Fill all fields and select the correct answer.");
  }

  currentQuizQuestions.push({ q: qText, options, correct: parseInt(correctIdx) });
  
  // Clear inputs
  ["q-text", "opt-0", "opt-1", "opt-2", "opt-3", "q-correct"].forEach(id => document.getElementById(id).value = "");
  
  updateTempList();
}

function updateTempList() {
  const listEl = document.getElementById("temp-questions-list");
  listEl.innerHTML = `<strong>Queued (${currentQuizQuestions.length}):</strong> ` + currentQuizQuestions.map(q => q.q).join(", ");
}

async function publishQuiz() {
  const title = document.getElementById("quiz-title").value.trim();
  if (!title || currentQuizQuestions.length === 0) return alert("Enter title and add questions");

  try {
    await addDoc(collection(db, "quizzes"), { title, questions: currentQuizQuestions, created: Date.now() });
    currentQuizQuestions = [];
    document.getElementById("quiz-title").value = "";
    document.getElementById("temp-questions-list").innerHTML = "";
    alert("Quiz Published! ✅");
    loadQuizzes();
  } catch (err) { alert("Error: " + err.message); }
}

// ===== QUIZ PLAYER (STUDENT) =====

async function loadQuizzes() {
  const list = document.getElementById("quiz-list");
  try {
    const snap = await getDocs(collection(db, "quizzes"));
    list.innerHTML = "";
    snap.forEach(doc => {
      const quiz = doc.data();
      list.innerHTML += `<div class="card p-4">🧠 <strong>${quiz.title}</strong><br><button onclick="startQuiz('${doc.id}')" class="mt-2 bg-orange-500 text-white px-5 py-2 rounded-xl">Start</button></div>`;
    });
  } catch (err) { list.innerHTML = "Error loading quizzes"; }
}

window.startQuiz = async (id) => {
  const snap = await getDocs(collection(db, "quizzes"));
  const quiz = snap.docs.find(d => d.id === id)?.data();
  if (!quiz) return;

  quizArea.classList.remove("hidden");
  let html = `<h2 class="text-2xl font-bold mb-4">${quiz.title}</h2>`;
  quiz.questions.forEach((q, i) => {
    html += `<div class="mb-6"><p class="font-bold">${i+1}. ${q.q}</p>`;
    q.options.forEach((opt, j) => {
      html += `<label class="block mt-2"><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`;
    });
    html += `</div>`;
  });
  html += `<button onclick="submitQuiz()" class="bg-green-600 text-white px-8 py-3 rounded-xl">Submit</button>`;
  quizArea.innerHTML = html;
};

// ===== EXPORTS TO WINDOW =====

window.selectRole = () => { showMain(false); loadMaterials(); loadQuizzes(); };
window.showAdminLogin = () => document.getElementById("admin-login").classList.remove("hidden");
window.hideAdminLogin = () => document.getElementById("admin-login").classList.add("hidden");
window.validateAdmin = async () => {
  const pass = document.getElementById("admin-pass").value;
  try { await signInWithEmailAndPassword(auth, "realmasasa@gmail.com", pass); } catch (err) { alert(err.message); }
};
window.signInWithGoogle = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { alert(err.message); } };
window.logout = () => signOut(auth);
window.uploadPDF = uploadPDF;
window.addQuestionToList = addQuestionToList;
window.publishQuiz = publishQuiz;
window.submitQuiz = () => alert("Quiz Submitted!");

setInterval(() => {
  const el = document.getElementById("live-time");
  if (el) el.textContent = new Date().toLocaleString("en-GB");
}, 1000);
