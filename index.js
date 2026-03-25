// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";

import {
  getAuth, signInWithEmailAndPassword,
  signOut, GoogleAuthProvider,
  signInWithRedirect, getRedirectResult
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// 🔴 YOUR CONFIG
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "X",
  appId: "X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// ===== UTILITIES =====
function showMain() {
  role-overlay.classList.add("hidden");
  main-header.classList.remove("hidden");
  main-content.classList.remove("hidden");
}

// ===== STUDENT ROLE =====
window.selectRole = () => {
  showMain();
  loadMaterials();
  loadQuizzes();
};

// ===== GOOGLE LOGIN =====
window.signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
};

getRedirectResult(auth).then(res => {
  if (res?.user) showMain();
});

// ===== ADMIN LOGIN =====
window.validateAdmin = async () => {
  const pass = admin-pass.value;
  await signInWithEmailAndPassword(auth,
    "realmasasa@gmail.com", pass);

  showMain();
  admin-tools.classList.remove("hidden");
};

// ===== LOGOUT =====
window.logout = () => signOut(auth).then(() => location.reload());

// ===== UPLOAD PDF =====
window.uploadPDF = async () => {

  const title = pdf-title.value;
  const file = pdf-file.files[0];

  if (!file) return alert("Select a PDF");

  const storageRef = ref(storage, "materials/" + file.name);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await addDoc(collection(db, "materials"), {
    title,
    url,
    created: Date.now()
  });

  alert("Uploaded!");
  loadMaterials();
};

// ===== LOAD MATERIALS =====
async function loadMaterials() {

  material-list.innerHTML = "";

  const q = query(collection(db, "materials"), orderBy("created", "desc"));
  const snap = await getDocs(q);

  snap.forEach(doc => {
    const m = doc.data();

    material-list.innerHTML += `
      <div class="bg-white p-4 rounded-xl shadow mb-3">
        📄 ${m.title}
        <a href="${m.url}" target="_blank"
          class="text-blue-600 ml-3">Download</a>
      </div>`;
  });
}

// ===== QUIZ SYSTEM =====
let questions = [];

window.addQuestion = () => {
  questions.push({
    q: "Sample question?",
    options: ["A","B","C","D"],
    correct: 0
  });
  alert("Sample question added");
};

window.publishQuiz = async () => {

  await addDoc(collection(db, "quizzes"), {
    title: quiz-title.value,
    questions
  });

  questions = [];
  alert("Quiz published");
  loadQuizzes();
};

// ===== LOAD QUIZZES =====
async function loadQuizzes() {

  quiz-list.innerHTML = "";

  const snap = await getDocs(collection(db, "quizzes"));

  snap.forEach(doc => {

    const quiz = doc.data();

    quiz-list.innerHTML += `
      <div class="bg-white p-4 rounded-xl shadow mb-3">
        🧠 ${quiz.title}
        <button onclick="startQuiz('${doc.id}')"
          class="ml-3 bg-orange-500 text-white px-3 py-1 rounded">
          Start
        </button>
      </div>`;
  });
}

// ===== START QUIZ =====
window.startQuiz = async (id) => {

  const snap = await getDocs(collection(db, "quizzes"));
  const quiz = snap.docs.find(d => d.id === id).data();

  quiz-area.classList.remove("hidden");

  let html = `<h2 class="text-xl font-bold mb-4">${quiz.title}</h2>`;

  quiz.questions.forEach((q, i) => {
    html += `<p>${i+1}. ${q.q}</p>`;
    q.options.forEach((opt, j) => {
      html += `
        <label>
          <input type="radio" name="q${i}" value="${j}">
          ${opt}
        </label><br>`;
    });
  });

  html += `
    <button onclick="submitQuiz()" 
      class="bg-green-600 text-white px-6 py-3 rounded mt-4">
      Submit
    </button>`;

  quiz-area.innerHTML = html;
};

// ===== SUBMIT QUIZ =====
window.submitQuiz = () => {
  alert("Quiz submitted!");
};
