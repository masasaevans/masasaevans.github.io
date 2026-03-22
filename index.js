const ADMIN_PASS = "admin123";
let currentRole = null;
let uploadedMaterials = JSON.parse(localStorage.getItem('masasa_materials')) || [];

// 1. CLOCK & LOCATION
function updateClock() {
    const timeEl = document.getElementById('live-time');
    const dateEl = document.getElementById('live-date');
    if(timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('en-GB');
        dateEl.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    }
}
setInterval(updateClock, 1000);
updateClock();

async function initLocation() {
    const locEl = document.getElementById('location-name');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
                const data = await res.json();
                locEl.textContent = `📍 ${data.city || data.locality || "Kenya"}`;
            } catch (e) { locEl.textContent = "📍 Nairobi"; }
        }, () => { locEl.textContent = "📍 Nairobi"; });
    }
}
initLocation();

// 2. ADMIN & ROLES
function showAdminLogin() {
    document.getElementById('role-buttons').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
}

function hideAdminLogin() {
    document.getElementById('role-buttons').classList.remove('hidden');
    document.getElementById('admin-login').classList.add('hidden');
}

function validateAdmin() {
    const pass = document.getElementById('admin-pass').value;
    if(pass === ADMIN_PASS) {
        currentRole = 'admin';
        document.getElementById('admin-tools').classList.remove('hidden');
        enterPortal();
    } else { alert("❌ That is not the correct key, Mr. Masasa."); }
}

function selectRole(role) {
    currentRole = role;
    enterPortal();
}

function enterPortal() {
    document.getElementById('role-overlay').style.display = 'none';
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    renderMaterials();
}

// 3. PDF HANDLER
function uploadPDF() {
    const title = document.getElementById('pdf-title').value;
    const fileInput = document.getElementById('pdf-file');
    const file = fileInput.files[0];

    if (!title || !file) return alert("Mr. Masasa, please add a title and select a file!");

    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedMaterials.unshift({ 
            title, 
            data: e.target.result, 
            date: new Date().toLocaleDateString() 
        });
        localStorage.setItem('masasa_materials', JSON.stringify(uploadedMaterials));
        renderMaterials();
        alert("Lesson Uploaded Successfully! ✅");
        document.getElementById('pdf-title').value = "";
        fileInput.value = "";
    };
    reader.readAsDataURL(file);
}

function renderMaterials() {
    const container = document.getElementById('assignments-section');
    if(uploadedMaterials.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-slate-400 font-bold py-20">No lessons uploaded yet. 📭</p>`;
        return;
    }

    container.innerHTML = uploadedMaterials.map((item, idx) => `
        <div class="bg-white p-6 rounded-[2rem] shadow-xl border-2 border-white hover:border-indigo-300 transition-all group overflow-hidden relative">
            <div class="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">📚</div>
            <h4 class="font-black text-xl text-slate-800 mb-1 truncate">${item.title}</h4>
            <p class="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Released: ${item.date}</p>
            
            <div class="grid grid-cols-1 gap-3">
                <button onclick="openPDF(${idx})" class="w-full bg-indigo-600 text-white py-3 rounded-xl font-black hover:bg-orange-500 hover:text-white transition-all transform hover:-translate-y-1">OPEN LESSON</button>
                <a href="${item.data}" download="${item.title}.pdf" class="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-center text-sm hover:bg-emerald-100 hover:text-emerald-700 transition-all">SAVE PDF</a>
            </div>

            ${currentRole === 'admin' ? `
                <button onclick="deleteMaterial(${idx})" class="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
            ` : ''}
        </div>
    `).join('');
}

function openPDF(index) {
    document.getElementById('pdf-frame').src = uploadedMaterials[index].data;
    document.getElementById('pdf-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closePDF() {
    document.getElementById('pdf-modal').classList.add('hidden');
    document.getElementById('pdf-frame').src = "";
    document.body.style.overflow = 'auto';
}

function deleteMaterial(idx) {
    if(confirm("Are you sure you want to delete this lesson?")) {
        uploadedMaterials.splice(idx, 1);
        localStorage.setItem('masasa_materials', JSON.stringify(uploadedMaterials));
        renderMaterials();
    }
}
