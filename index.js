// index.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";

import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
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

const overlay = document.getElementById("overlay");
const appUI = document.getElementById("app");
const header = document.getElementById("header");
const materialsDiv = document.getElementById("materials");
const uploadBtn = document.getElementById("uploadBtn");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    if (user.email === "realmasasa@gmail.com") {
      overlay.classList.add("hidden");
      appUI.classList.remove("hidden");
      header.classList.remove("hidden");
      loadMaterials();
    } else {
      alert("Access Denied!\n\nOnly realmasasa@gmail.com is allowed.");
      signOut(auth);
    }
  } else {
    overlay.classList.remove("hidden");
    appUI.classList.add("hidden");
    header.classList.add("hidden");
  }
});

window.googleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error(err);
    alert("Google login failed: " + err.message);
  }
};

window.logout = () => {
  if (confirm("Logout?")) signOut(auth);
};

window.upload = async () => {
  if (!currentUser || currentUser.email !== "realmasasa@gmail.com") {
    return alert("Access Denied! Only realmasasa@gmail.com can upload.");
  }

  const title = document.getElementById("title").value.trim();
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  if (!title) return alert("Please enter a material title");
  if (!file) return alert("Please select a PDF file");

  // Disable button during upload
  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading... Please wait";

  try {
    const storageRef = ref(storage, `materials/${Date.now()}-${file.name}`);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "materials"), {
      title: title,
      url: url,
      created: Date.now(),
      uploadedBy: currentUser.email
    });

    alert("✅ PDF uploaded successfully!");

    // Clear form
    document.getElementById("title").value = "";
    fileInput.value = "";

    loadMaterials();
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed.\n\nError: " + err.message + "\n\nPlease try again.");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload PDF";
  }
};

async function loadMaterials() {
  materialsDiv.innerHTML = `<p class="text-gray-500 p-8 text-center">Loading materials...</p>`;

  try {
    const q = query(collection(db, "materials"), orderBy("created", "desc"));
    const snap = await getDocs(q);

    materialsDiv.innerHTML = "";
    if (snap.empty) {
      materialsDiv.innerHTML = `<p class="text-gray-500 p-8 text-center bg-white rounded-3xl">No materials uploaded yet.</p>`;
      return;
    }

    snap.forEach(doc => {
      const m = doc.data();
      materialsDiv.innerHTML += `
        <div class="card">
          <strong class="text-lg">${m.title}</strong><br>
          <a href="${m.url}" target="_blank" class="text-orange-600 underline hover:text-orange-700 mt-2 inline-block">
            📥 Download PDF
          </a>
        </div>`;
    });
  } catch (err) {
    console.error(err);
    materialsDiv.innerHTML = `<p class="text-red-500 p-8 text-center">Error loading materials. Please refresh.</p>`;
  }
}

// Live Time
setInterval(() => {
  const timeEl = document.getElementById("time");
  if (timeEl) timeEl.textContent = new Date().toLocaleString("en-GB");
}, 1000);
