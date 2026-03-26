import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider, signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

let currentUser = null;

// UI refs
const overlay = document.getElementById("role-overlay");
const main = document.getElementById("main-content");
const header = document.getElementById("main-header");
const adminTools = document.getElementById("admin-tools");

// ================= AUTH =================
window.continueStudent = () => {
  localStorage.setItem("role", "student");
  showApp(false);
};

window.showAdminLogin = () => {
  document.getElementById("admin-login").classList.remove("hidden");
};

window.hideAdminLogin = () => {
  document.getElementById("admin-login").classList.add("hidden");
};

window.validateAdmin = () => {
  const pass = document.getElementById("admin-pass").value;

  if (pass === "1234") {
    localStorage.setItem("role", "admin");
    hideAdminLogin();
    showApp(true);
  } else {
    alert("Wrong password");
  }
};

window.signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  currentUser = result.user;
  localStorage.setItem("role", "student");
  showApp(false);
};

// ================= UI =================
function showApp(isAdmin) {
  overlay.classList.add("hidden");
  main.classList.remove("hidden");
  header.classList.remove("hidden");

  if (isAdmin) adminTools.classList.remove("hidden");

  loadMaterials();
  loadResults();
}

window.logout = () => {
  localStorage.clear();
  signOut(auth);
  location.reload();
};

// ================= MATERIALS =================
window.uploadPDF = async () => {
  if (localStorage.getItem("role") !== "admin") {
    return alert("Admin only");
  }

  const title = document.getElementById("pdf-title").value;
  const file = document.getElementById("pdf-file").files[0];

  const storageRef = ref(storage, file.name);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await addDoc(collection(db, "materials"), { title, url });

  alert("Uploaded!");
  loadMaterials();
};

async function loadMaterials() {
  const list = document.getElementById("material-list");
  list.innerHTML = "Loading...";

  const snap = await getDocs(collection(db, "materials"));

  list.innerHTML = "";
  snap.forEach(doc => {
    const m = doc.data();
    list.innerHTML += `
      <div class="card">
        ${m.title}<br>
        <a href="${m.url}" target="_blank">Open</a>
      </div>
    `;
  });
}

// ================= RESULTS =================
async function loadResults() {
  if (!auth.currentUser) return;

  const q = query(
    collection(db, "quizResults"),
    where("userId", "==", auth.currentUser.uid)
  );

  const snap = await getDocs(q);

  const list = document.getElementById("results-list");
  list.innerHTML = "";

  snap.forEach(doc => {
    const r = doc.data();
    list.innerHTML += `
      <div class="card">
        ${r.quizTitle} - ${r.percentage}%
      </div>
    `;
  });
}

// ================= INIT =================
window.onload = () => {
  const role = localStorage.getItem("role");
  if (role) showApp(role === "admin");
};

// live time
setInterval(() => {
  document.getElementById("live-time").innerText =
    new Date().toLocaleString();
}, 1000);
