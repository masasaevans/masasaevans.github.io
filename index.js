// index.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, orderBy, 
  doc, getDoc, setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, GoogleAuthProvider, 
  signInWithPopup, onAuthStateChanged 
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

let currentUser = null;
let currentQuiz = null;
let currentQuizId = null;
let timerInterval = null;
let timeLeft = 1800;
let currentQuizQuestions = [];

// DOM Elements
const roleOverlay = document.getElementById("role-overlay");
const mainHeader = document.getElementById("main-header");
const mainContent = document.getElementById("main-content");
const adminTools = document.getElementById("admin-tools");
const quizArea = document.getElementById("quiz-area");
const materialList = document.getElementById("material-list");
const quizList = document.getElementById("quiz-list");
const resultsList = document.getElementById("results-list");

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    const isAdmin = user.email === "realmasasa@gmail.com";
    showMain(isAdmin);
    loadMaterials();
    loadQuizzes();
    if (!isAdmin) loadMyResults();
  } else {
    hideAll();
  }
});

function showMain(isAdmin) {
  roleOverlay.classList.add("hidden");
  mainHeader.classList.remove("hidden");
  mainContent.classList.remove("hidden");
  adminTools.classList.toggle("hidden", !isAdmin);
}

function hideAll() {
  roleOverlay.classList.remove("hidden");
  mainHeader.classList.add("hidden");
  mainContent.classList.add("hidden");
  adminTools.classList.add("hidden");
  quizArea.classList.add("hidden");
}

// ====================== PDF UPLOAD ======================
window.uploadPDF = async () => {
  if (!currentUser || currentUser.email !== "realmasasa@gmail.com") 
    return alert("❌ Only realmasasa@gmail.com can upload materials.");

  const title = document.getElementById("pdf-title").value.trim();
  const file = document.getElementById("pdf-file").files[0];

  if (!title || !file) return alert("Please enter title and select PDF.");

  try {
    const storageRef = ref(storage, `materials/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "materials"), {
      title, url, created: Date.now(), uploadedBy: currentUser.email
    });

    alert("✅ PDF uploaded successfully!");
    document.getElementById("pdf-title").value = "";
    document.getElementById("pdf-file").value = "";
    loadMaterials();
  } catch (err) {
    alert("Upload failed: " + err.message);
  }
};

async function loadMaterials() {
  materialList.innerHTML = `<p class="text-gray-500">Loading...</p>`;
  try {
    const q = query(collection(db, "materials"), orderBy("created", "desc"));
    const snap = await getDocs(q);
    materialList.innerHTML = "";
    if (snap.empty) {
      materialList.innerHTML = `<p class="text-gray-500">No materials yet.</p>`;
      return;
    }
    snap.forEach(doc => {
      const m = doc.data();
      materialList.innerHTML += `
        <div class="card p-5">
          📄 <strong>${m.title}</strong><br>
          <a href="${m.url}" target="_blank" class="text-orange-600 underline">Download PDF</a>
        </div>`;
    });
  } catch (e) {
    materialList.innerHTML = `<p class="text-red-500">Error loading materials</p>`;
  }
}

// ====================== QUIZ BUILDER ======================
window.addQuestionToList = () => {
  if (!currentUser || currentUser.email !== "realmasasa@gmail.com") 
    return alert("❌ Admin only");

  const qText = document.getElementById("q-text").value.trim();
  const options = [
    document.getElementById("opt-0").value.trim(),
    document.getElementById("opt-1").value.trim(),
    document.getElementById("opt-2").value.trim(),
    document.getElementById("opt-3").value.trim()
  ];
  const correct = parseInt(document.getElementById("q-correct").value);

  if (!qText || options.some(o => !o) || isNaN(correct)) 
    return alert("Please fill all fields and select correct answer.");

  currentQuizQuestions.push({ q: qText, options, correct });

  // Clear inputs
  ["q-text","opt-0","opt-1","opt-2","opt-3","q-correct"].forEach(id => 
    document.getElementById(id).value = ""
  );

  updateTempList();
};

function updateTempList() {
  const el = document.getElementById("temp-questions-list");
  el.innerHTML = currentQuizQuestions.length === 0 
    ? "No questions added yet." 
    : `<strong>Questions (${currentQuizQuestions.length}):</strong><br>` + 
      currentQuizQuestions.map((q,i) => `${i+1}. ${q.q.substring(0,55)}${q.q.length>55?'...':''}`).join("<br>");
}

window.publishQuiz = async () => {
  if (!currentUser || currentUser.email !== "realmasasa@gmail.com") 
    return alert("❌ Admin only");

  const title = document.getElementById("quiz-title").value.trim();
  if (!title || currentQuizQuestions.length === 0) 
    return alert("Enter quiz title and add at least one question.");

  try {
    await addDoc(collection(db, "quizzes"), {
      title, 
      questions: currentQuizQuestions,
      created: Date.now(),
      createdBy: currentUser.email
    });

    alert("✅ Quiz published successfully!");
    currentQuizQuestions = [];
    document.getElementById("quiz-title").value = "";
    document.getElementById("temp-questions-list").innerHTML = "No questions added yet.";
    loadQuizzes();
  } catch (err) {
    alert("Failed to publish quiz: " + err.message);
  }
};

// ====================== QUIZ PLAYER ======================
async function loadQuizzes() {
  quizList.innerHTML = `<p class="text-gray-500">Loading quizzes...</p>`;
  try {
    const snap = await getDocs(collection(db, "quizzes"));
    quizList.innerHTML = "";
    if (snap.empty) {
      quizList.innerHTML = `<p class="text-gray-500">No quizzes yet.</p>`;
      return;
    }
    snap.forEach(d => {
      const quiz = d.data();
      quizList.innerHTML += `
        <div class="card p-5">
          🧠 <strong>${quiz.title}</strong><br>
          <button onclick="startQuiz('${d.id}')" class="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-2xl w-full">
            Start Quiz
          </button>
        </div>`;
    });
  } catch (e) {
    quizList.innerHTML = `<p class="text-red-500">Error loading quizzes</p>`;
  }
}

window.startQuiz = async (quizId) => {
  try {
    const docSnap = await getDoc(doc(db, "quizzes", quizId));
    if (!docSnap.exists()) return alert("Quiz not found");

    currentQuiz = docSnap.data();
    currentQuizId = quizId;
    timeLeft = 1800;

    quizArea.classList.remove("hidden");

    let html = `
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-3xl font-bold">${currentQuiz.title}</h2>
        <div id="timer" class="bg-red-100 text-red-700 px-6 py-3 rounded-2xl font-mono text-xl font-bold">30:00</div>
      </div>`;

    currentQuiz.questions.forEach((q, i) => {
      html += `<div class="mb-10"><p class="font-semibold text-lg mb-4">${i+1}. ${q.q}</p>`;
      q.options.forEach((opt, j) => {
        html += `
          <label class="flex items-center gap-3 mb-4 cursor-pointer hover:bg-orange-50 p-3 rounded-2xl transition">
            <input type="radio" name="q${i}" value="${j}" class="w-5 h-5 accent-orange-500">
            <span>${opt}</span>
          </label>`;
      });
      html += `</div>`;
    });

    html += `<button onclick="submitQuiz()" class="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-3xl text-xl font-bold">Submit Quiz</button>`;
    quizArea.innerHTML = html;
    startTimer();
  } catch (err) {
    alert("Failed to load quiz");
  }
};

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const timerEl = document.getElementById("timer");
    if (timerEl) timerEl.textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);
}

window.submitQuiz = async () => {
  if (timerInterval) clearInterval(timerInterval);
  if (!currentQuiz || !currentUser) return;

  let score = 0;
  const total = currentQuiz.questions.length;

  currentQuiz.questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (selected && parseInt(selected.value) === q.correct) score++;
  });

  const percentage = Math.round((score / total) * 100);

  try {
    await setDoc(doc(db, "quizResults", `${currentQuizId}_${currentUser.uid}`), {
      quizId: currentQuizId,
      quizTitle: currentQuiz.title,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      score, total, percentage,
      submittedAt: serverTimestamp()
    });
  } catch (e) { console.error(e); }

  alert(`✅ Quiz Completed!\n\nScore: ${score}/${total} (${percentage}%)\n\n${percentage >= 80 ? '🎉 Excellent!' : percentage >= 60 ? '👍 Good job!' : '💪 Keep practicing!'}`);

  quizArea.classList.add("hidden");
  if (currentUser.email !== "realmasasa@gmail.com") loadMyResults();
};

// ====================== RESULTS ======================
async function loadMyResults() {
  if (!currentUser || currentUser.email === "realmasasa@gmail.com") return;

  resultsList.innerHTML = `<p class="text-gray-500">Loading your results...</p>`;
  try {
    const snap = await getDocs(collection(db, "quizResults"));
    let html = "";
    snap.forEach(d => {
      const r = d.data();
      if (r.userId === currentUser.uid) {
        html += `
          <div class="card p-5">
            <strong>${r.quizTitle}</strong><br>
            <span class="text-green-600 font-bold">${r.score}/${r.total} (${r.percentage}%)</span><br>
            <small class="text-gray-500">${new Date().toLocaleDateString()}</small>
          </div>`;
      }
    });
    resultsList.innerHTML = html || `<p class="text-gray-500">No results yet. Take a quiz!</p>`;
  } catch (e) {
    resultsList.innerHTML = `<p class="text-red-500">Error loading results</p>`;
  }
}

// ====================== AUTH ======================
window.selectRole = () => showMain(false);
window.showAdminLogin = () => document.getElementById("admin-login").classList.remove("hidden");
window.hideAdminLogin = () => document.getElementById("admin-login").classList.add("hidden");

window.validateAdmin = async () => {
  const pass = document.getElementById("admin-pass").value;
  if (!pass) return alert("Please enter password");
  try {
    await signInWithEmailAndPassword(auth, "realmasasa@gmail.com", pass);
    hideAdminLogin();
    document.getElementById("admin-pass").value = "";
  } catch (err) {
    alert("Login failed. Check password.");
  }
};

window.signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    alert("Google sign-in failed: " + err.message);
  }
};

window.logout = () => {
  if (confirm("Are you sure you want to logout?")) signOut(auth);
};

// Live Time
setInterval(() => {
  const el = document.getElementById("live-time");
  if (el) el.textContent = new Date().toLocaleString("en-GB");
}, 1000);
