import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// ✅ YOUR CONFIG
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

// UI
const overlay = document.getElementById("overlay");
const appUI = document.getElementById("app");
const header = document.getElementById("header");
const adminPanel = document.getElementById("adminPanel");

// ROLE
window.enterStudent = () => {
  localStorage.setItem("role", "student");
  startApp();
};

window.showAdminLogin = () => {
  document.getElementById("adminBox").classList.remove("hidden");
};

window.loginAdmin = () => {
  const pass = document.getElementById("adminPass").value;

  if (pass === "1234") {
    localStorage.setItem("role", "admin");
    startApp();
  } else {
    alert("Wrong password");
  }
};

window.googleLogin = async () => {
  await signInWithPopup(auth, new GoogleAuthProvider());
  localStorage.setItem("role", "student");
  startApp();
};

function startApp() {
  overlay.classList.add("hidden");
  appUI.classList.remove("hidden");
  header.classList.remove("hidden");

  if (localStorage.getItem("role") === "admin") {
    adminPanel.classList.remove("hidden");
  }

  loadMaterials();
}

window.logout = () => {
  localStorage.clear();
  signOut(auth);
  location.reload();
};

// UPLOAD
window.upload = async () => {
  if (localStorage.getItem("role") !== "admin") return alert("Admin only");

  const title = document.getElementById("title").value;
  const file = document.getElementById("file").files[0];

  const storageRef = ref(storage, "pdfs/" + file.name);
  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  await addDoc(collection(db, "materials"), { title, url });

  alert("Uploaded!");
  loadMaterials();
};

// LOAD
async function loadMaterials() {
  const el = document.getElementById("materials");
  el.innerHTML = "Loading...";

  const snap = await getDocs(collection(db, "materials"));

  el.innerHTML = "";
  snap.forEach(doc => {
    const m = doc.data();
    el.innerHTML += `
      <div class="card">
        ${m.title}<br>
        <a href="${m.url}" target="_blank">Open</a>
      </div>
    `;
  });
}

// TIME
setInterval(() => {
  document.getElementById("time").innerText =
    new Date().toLocaleString();
}, 1000);

// INIT
window.onload = () => {
  if (localStorage.getItem("role")) startApp();
};
