// ================= SUPABASE SETUP =================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://uunmwqeqvlrrlgbnejza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bm13cWVxdmxycmxnYm5lanphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTg1NTgsImV4cCI6MjA5MDAzNDU1OH0.3l8zKwRXWFp6STYQkCKEwheSF8sx0pGj0HZY55O_0NU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================= DOM =================
const overlay = document.getElementById("overlay");
const appUI = document.getElementById("app");
const header = document.getElementById("header");
const materialsDiv = document.getElementById("materials");
const uploadBtn = document.getElementById("uploadBtn");

// ================= STATE =================
let currentUser = null;

// ================= AUTH STATE =================
supabase.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user;

  if (currentUser) {
    console.log("Logged in:", currentUser.email);

    if (isAdmin()) {
      startApp();
    } else {
      alert("❌ Access denied.\n\nOnly admin allowed.");
      supabase.auth.signOut();
    }

  } else {
    showLogin();
  }
});

// ================= ROLE CHECK =================
function isAdmin() {
  return currentUser?.email === "realmasasa@gmail.com";
}

// ================= UI =================
function startApp() {
  overlay.classList.add("hidden");
  appUI.classList.remove("hidden");
  header.classList.remove("hidden");
  loadMaterials();
}

function showLogin() {
  overlay.classList.remove("hidden");
  appUI.classList.add("hidden");
  header.classList.add("hidden");
}

// ================= AUTH =================
window.googleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.href
    }
  });

  if (error) alert("Login failed: " + error.message);
};

window.logout = async () => {
  await supabase.auth.signOut();
};

// ================= UPLOAD =================
window.upload = async () => {
  if (!isAdmin()) return alert("Admin only");

  const titleEl = document.getElementById("title");
  const fileEl = document.getElementById("file");

  const title = titleEl.value.trim();
  const file = fileEl.files[0];

  if (!title) return alert("Enter title");
  if (!file) return alert("Select file");

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  try {
    const safeName = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const fileName = `${Date.now()}-${safeName}.pdf`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('materials')
      .getPublicUrl(fileName);

    // Save to DB
    const { error: dbError } = await supabase
      .from('materials')
      .insert({
        title,
        url: data.publicUrl,
        filename: fileName,
        uploaded_by: currentUser.email,
        created_at: new Date().toISOString()
      });

    if (dbError) console.warn("DB issue:", dbError.message);

    alert("✅ Upload successful!");

    titleEl.value = "";
    fileEl.value = "";

    loadMaterials();

  } catch (err) {
    console.error(err);
    alert("❌ Upload failed: " + err.message);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload PDF";
  }
};

// ================= LOAD MATERIALS =================
async function loadMaterials() {
  materialsDiv.innerHTML = "<p class='text-gray-500'>Loading...</p>";

  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      materialsDiv.innerHTML = "<p>No materials yet</p>";
      return;
    }

    materialsDiv.innerHTML = "";

    data.forEach(m => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <strong>${m.title}</strong><br>
        <a href="${m.url}" target="_blank" class="text-orange-600 underline">
          Open PDF
        </a>
      `;

      materialsDiv.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    materialsDiv.innerHTML = "<p class='text-red-500'>Error loading materials</p>";
  }
}

// ================= CLOCK =================
setInterval(() => {
  const el = document.getElementById("time");
  if (el) el.textContent = new Date().toLocaleString();
}, 1000);
