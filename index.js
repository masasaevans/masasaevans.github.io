import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

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

// ===== UTILITIES =====
function showMain(isAdmin = false) {
  roleOverlay.classList.add("hidden");
  mainHeader.classList.remove("hidden");
  mainContent.classList.remove("hidden");
  
  if (isAdmin) {
    adminTools.classList.remove("hidden");
  }
}

// ===== STUDENT ROLE =====
window.selectRole = () => {
  showMain(false);           // <-- FIXED: now properly hides overlay
  loadMaterials();
  loadQuizzes();
};

// ===== ADMIN PANEL =====
window.showAdminLogin = () => document.getElementById("admin-login").classList.remove("hidden");
window.hideAdminLogin = () => document.getElementById("admin-login").classList.add("hidden");

// ===== ADMIN LOGIN =====
window.validateAdmin = async () => {
  const pass = document.getElementById("admin-pass").value;
  try {
    await signInWithEmailAndPassword(auth, "realmasasa@gmail.com", pass);
    showMain(true);          // <-- now passes true so admin tools show
    alert("Admin login successful ✅");
    loadMaterials(); 
    loadQuizzes();
  } catch (err) { 
    alert("Admin login failed ❌\n" + err.message); 
  }
};

// ===== GOOGLE LOGIN =====
window.signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    alert(`Google login successful ✅\nWelcome ${result.user.displayName}`);
    showMain(false);         // Google user = student (not admin)
    loadMaterials(); 
    loadQuizzes();
  } catch (err) { 
    alert("Google login failed ❌\n" + err.message); 
  }
};

// ===== LOGOUT =====
window.logout = () => signOut(auth).then(() => location.reload());

// ===== ADMIN BUTTONS =====
document.getElementById("upload-pdf-btn").addEventListener("click", uploadPDF);
document.getElementById("add-question-btn").addEventListener("click", addQuestion);
document.getElementById("publish-quiz-btn").addEventListener("click", publishQuiz);

// ===== UPLOAD PDF =====
async function uploadPDF() {
  const title = document.getElementById("pdf-title").value;
  const file = document.getElementById("pdf-file").files[0];
  if (!file) return alert("Please select a PDF");
  const storageRef = ref(storage, "materials/" + file.name);
  try {
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, "materials"), { title, url, created: Date.now() });
    alert("PDF uploaded successfully ✅"); 
    loadMaterials();
  } catch (err) { alert("Upload failed ❌\n" + err.message); }
}

// ===== LOAD MATERIALS =====
async function loadMaterials() {
  const list = document.getElementById("material-list"); 
  list.innerHTML = "";
  const q = query(collection(db, "materials"), orderBy("created","desc"));
  const snap = await getDocs(q);
  snap.forEach(doc => { 
    const m = doc.data(); 
    list.innerHTML += `<div class="card">📄 \( {m.title} <a href=" \){m.url}" target="_blank" class="text-orange-600 underline">Download</a></div>`; 
  });
}

// ===== QUIZ SYSTEM =====
let questions = [];
function addQuestion() { 
  questions.push({ q:"Sample question?", options:["A","B","C","D"], correct:0 }); 
  alert("Sample question added"); 
}
async function publishQuiz() {
  const title = document.getElementById("quiz-title").value;
  if(!title) return alert("Enter quiz title");
  try { 
    await addDoc(collection(db,"quizzes"),{title,questions}); 
    questions=[]; 
    alert("Quiz published ✅"); 
    loadQuizzes(); 
  }
  catch(err){ alert("Quiz publish failed ❌\n"+err.message); }
}

// ===== LOAD QUIZZES =====
async function loadQuizzes() {
  const list = document.getElementById("quiz-list"); 
  list.innerHTML="";
  const snap = await getDocs(collection(db,"quizzes"));
  snap.forEach(doc => { 
    const quiz = doc.data(); 
    list.innerHTML += `<div class="card">🧠 \( {quiz.title} <button onclick="startQuiz(' \){doc.id}')" class="bg-orange-500 text-white px-4 py-1 rounded">Start</button></div>`; 
  });
}

// ===== START QUIZ =====
window.startQuiz = async id => {
  const snap = await getDocs(collection(db,"quizzes"));
  const quizDoc = snap.docs.find(d=>d.id===id);
  if(!quizDoc) return alert("Quiz not found ❌");
  const quiz = quizDoc.data(); 
  quizArea.classList.remove("hidden");
  let html=`<h2 class="text-2xl font-black mb-6">${quiz.title}</h2>`;
  quiz.questions.forEach((q,i)=>{ 
    html+=`<p class="font-bold mt-6">${i+1}. ${q.q}</p>`; 
    q.options.forEach((opt,j)=>{ 
      html+=`<label class="block mt-2"><input type="radio" name="q\( {i}" value=" \){j}"> ${opt}</label>`; 
    }); 
  });
  html+=`<button onclick="submitQuiz()" class="mt-8 bg-green-600 text-white px-8 py-3 rounded-xl font-bold">Submit Quiz</button>`;
  quizArea.innerHTML=html;
};

// ===== SUBMIT QUIZ =====
window.submitQuiz = ()=>alert("Quiz submitted ✅");

// ===== LIVE TIME =====
setInterval(()=>{ 
  const el=document.getElementById("live-time"); 
  if(el) el.textContent=new Date().toLocaleString(); 
},1000);
