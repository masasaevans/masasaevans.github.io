// index.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_HOU827BDT-QRDJMJU0QBF1GznxuT3rM",
  authDomain: "masasa-online.firebaseapp.com",
  projectId: "masasa-online",
  storageBucket: "masasa-online.firebasestorage.app",
  messagingSenderId: "975253887376",
  appId: "1:975253887376:web:c1d6e59922a7d3ac2cbb15"
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
      alert("Access Denied!\nOnly realmasasa@gmail.com is allowed.");
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
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    alert("Login failed: " + e.message);
  }
};

window.logout = () => signOut(auth);

window.upload = async () => {
  if (!currentUser || currentUser.email !== "realmasasa@gmail.com") {
    return alert("Access Denied");
  }

  const title = document.getElementById("title").value.trim();
  const file = document.getElementById("file").files[0];

  if (!title) return alert("Enter title");
  if (!file) return alert("Select a PDF file");

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading... (this may take a few seconds)";

  try {
    console.log("Starting upload...");
    const storageRef = ref(storage, `materials/${Date.now()}-${file.name}`);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "materials"), {
      title,
      url,
      created: Date.now()
    });

    alert("✅ Upload Successful!");
    document.getElementById("title").value = "";
    document.getElementById("file").value = "";
    loadMaterials();
  } catch (err) {
    console.error("Upload Error:", err);
    alert("Upload Failed!\n\nMessage: " + err.message + "\n\nCode: " + (err.code || "unknown"));
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload PDF";
  }
};

async function loadMaterials() {
  materialsDiv.innerHTML = "<p>Loading...</p>";
  try {
    const snap = await getDocs(query(collection(db, "materials"), orderBy("created", "desc")));
    materialsDiv.innerHTML = "";
    if (snap.empty) {
      materialsDiv.innerHTML = "<p class='text-gray-500'>No materials yet.</p>";
      return;
    }
    snap.forEach(d => {
      const m = d.data();
      materialsDiv.innerHTML += `
        <div class="card">
          <strong>${m.title}</strong><br>
          <a href="${m.url}" target="_blank" class="text-orange-600">Download PDF</a>
        </div>`;
    });
  } catch (e) {
    materialsDiv.innerHTML = "<p class='text-red-500'>Error loading list</p>";
  }
}
