// index.js - Supabase Version
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";     // ← Replace with your URL
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";   // ← Replace with your anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const overlay = document.getElementById("overlay");
const appUI = document.getElementById("app");
const header = document.getElementById("header");
const materialsDiv = document.getElementById("materials");
const uploadBtn = document.getElementById("uploadBtn");

let currentUser = null;

supabase.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user;
  if (currentUser) {
    if (currentUser.email === "realmasasa@gmail.com") {
      overlay.classList.add("hidden");
      appUI.classList.remove("hidden");
      header.classList.remove("hidden");
      loadMaterials();
    } else {
      alert("Access Denied!\n\nOnly realmasasa@gmail.com is allowed.");
      supabase.auth.signOut();
    }
  } else {
    overlay.classList.remove("hidden");
    appUI.classList.add("hidden");
    header.classList.add("hidden");
  }
});

window.googleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) alert("Google login failed: " + error.message);
};

window.logout = async () => {
  await supabase.auth.signOut();
};

window.upload = async () => {
  if (!currentUser || currentUser.email !== "realmasasa@gmail.com") {
    return alert("Access Denied");
  }

  const title = document.getElementById("title").value.trim();
  const file = document.getElementById("file").files[0];

  if (!title) return alert("Enter a title");
  if (!file) return alert("Select a PDF file");

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  try {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${title.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('materials')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('materials')
      .getPublicUrl(fileName);

    // Save metadata to database (optional but useful)
    const { error: dbError } = await supabase
      .from('materials')
      .insert({ 
        title: title,
        url: urlData.publicUrl,
        filename: fileName,
        uploaded_by: currentUser.email,
        created_at: new Date()
      });

    if (dbError) console.error("DB save error:", dbError);

    alert("✅ PDF uploaded successfully!");
    document.getElementById("title").value = "";
    document.getElementById("file").value = "";
    loadMaterials();
  } catch (err) {
    console.error(err);
    alert("Upload failed: " + err.message);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload PDF";
  }
};

async function loadMaterials() {
  materialsDiv.innerHTML = "<p class='text-gray-500'>Loading materials...</p>";

  try {
    // Try loading from database first (if you created the table)
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });

    materialsDiv.innerHTML = "";
    if (data && data.length > 0) {
      data.forEach(m => {
        materialsDiv.innerHTML += `
          <div class="card">
            <strong>${m.title}</strong><br>
            <a href="${m.url}" target="_blank" class="text-orange-600 underline">Download PDF</a>
          </div>`;
      });
    } else {
      // Fallback: list files directly from storage bucket
      const { data: files } = await supabase.storage.from('materials').list();
      if (files && files.length > 0) {
        for (const file of files) {
          const { data: urlData } = supabase.storage.from('materials').getPublicUrl(file.name);
          materialsDiv.innerHTML += `
            <div class="card">
              <strong>${file.name}</strong><br>
              <a href="${urlData.publicUrl}" target="_blank" class="text-orange-600 underline">Download PDF</a>
            </div>`;
        }
      } else {
        materialsDiv.innerHTML = "<p class='text-gray-500'>No materials uploaded yet.</p>";
      }
    }
  } catch (err) {
    materialsDiv.innerHTML = "<p class='text-red-500'>Error loading materials</p>";
  }
}
