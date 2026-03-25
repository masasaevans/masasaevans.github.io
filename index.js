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
function showMain() {
  roleOverlay.classList.add("hidden");
  mainHeader.classList.remove("hidden");
  mainContent.classList.remove("hidden");
}

// ===== STUDENT ROLE =====
window.selectRole = () => {
  showMain();
  loadMaterials();
  loadQuizzes();
};

// ===== ADMIN LOGIN PANEL =====
window.showAdminLogin = () => document.getElementById("admin-login").classList.remove("hidden");
window.hideAdminLogin = () => document.getElementById("admin-login").classList.add("hidden");

// ===== ADMIN LOGIN =====
window.validateAdmin = async () => {
  const pass = document.getElementById("admin-pass").value;
  try {
    await signInWithEmailAndPassword(auth, "realmasasa@gmail.com", pass);
    showMain();
    adminTools.classList.remove("hidden");
    alert("Admin login successful ✅");
    loadMaterials();
    loadQuizzes();
  } catch (err) {
    alert("Admin login failed ❌\n" + err.message);
    console.error(err);
  }
};

// ===== GOOGLE LOGIN (POPUP) =====
window.signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Google login successful ✅\nWelcome ${user.displayName}`);
    showMain();
    loadMaterials();
    loadQuizzes();
  } catch (err) {
    alert("Google login failed ❌\n" + err.message);
    console.error(err);
  }
};

// ===== LOGOUT =====
window.logout = () => signOut(auth).then(() => location.reload());

// ===== UPLOAD PDF =====
window.uploadPDF = async () => {
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
  } catch (err) {
    alert("Upload failed ❌\n" + err.message);
    console.error(err);
  }
};

// ===== LOAD MATERIALS =====
async function loadMaterials() {
  const list = document.getElementById("material-list");
  list.innerHTML = "";
  const q = query(collection(db, "materials"), orderBy("created", "desc"));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const m = doc.data();
    list.innerHTML += `<div class="card">📄 ${m.title} <a href="${m.url}" target="_blank">Download</a></div>`;
  });
}

// ===== QUIZ SYSTEM =====
let questions = [];
window.addQuestion = () => { questions.push({ q:"Sample question?", options:["A","B","C","D"], correct:0 }); alert("Sample question added"); };
window.publishQuiz = async () => {
  const title = document.getElementById("quiz-title").value;
  try { await addDoc(collection(db,"quizzes"),{title,questions}); questions=[]; alert("Quiz published ✅"); loadQuizzes(); }
  catch(err){ alert("Quiz publish failed ❌\n"+err.message); console.error(err);}
};

// ===== LOAD QUIZZES =====
async function loadQuizzes() {
  const list = document.getElementById("quiz-list");
  list.innerHTML="";
  const snap=await getDocs(collection(db,"quizzes"));
  snap.forEach(doc=>{
    const quiz = doc.data();
    list.innerHTML+=`<div class="card">🧠 ${quiz.title} <button onclick="startQuiz('${doc.id}')">Start</button></div>`;
  });
}

// ===== START QUIZ =====
window.startQuiz = async (id) => {
  const snap = await getDocs(collection(db,"quizzes"));
  const quizDoc = snap.docs.find(d=>d.id===id);
  if(!quizDoc) return alert("Quiz not found ❌");
  const quiz = quizDoc.data();
  quizArea.classList.remove("hidden");
  let html=`<h2>${quiz.title}</h2>`;
  quiz.questions.forEach((q,i)=>{
    html+=`<p>${i+1}. ${q.q}</p>`;
    q.options.forEach((opt,j)=>{ html+=`<label><input type="radio" name="q${i}" value="${j}">${opt}</label><br>`; });
  });
  html+=`<button onclick="submitQuiz()">Submit</button>`;
  quizArea.innerHTML=html;
};

// ===== SUBMIT QUIZ =====
window.submitQuiz=()=>alert("Quiz submitted ✅");

// ===== LIVE TIME =====
setInterval(()=>{ const el=document.getElementById("live-time"); if(el) el.textContent=new Date().toLocaleString(); },1000);
