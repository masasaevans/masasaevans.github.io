const ADMIN_PASS = "admin123";
let currentRole = null;
let uploadedMaterials = JSON.parse(localStorage.getItem('masasa_materials')) || [];

// Update Time Every Second
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

// Role Handlers
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
    } else { alert("Wrong password!"); }
}

function selectRole(role) {
    currentRole = role;
    enterPortal();
}

function enterPortal() {
    document.getElementById('role-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    renderMaterials();
}

// PDF Logic
function uploadPDF() {
    const title = document.getElementById('pdf-title').value;
    const fileInput = document.getElementById('pdf-file');
    const file = fileInput.files[0];

    if (!title || !file) return alert("Fill title and choose file!");

    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedMaterials.unshift({ title, data: e.target.result, date: new Date().toLocaleDateString() });
        localStorage.setItem('masasa_materials', JSON.stringify(uploadedMaterials));
        renderMaterials();
        alert("Success!");
    };
    reader.readAsDataURL(file);
}

function renderMaterials() {
    const container = document.getElementById('assignments-section');
    container.innerHTML = uploadedMaterials.map((item, idx) => `
        <div class="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
            <h4 class="font-bold text-lg mb-4 truncate">${item.title}</h4>
            <div class="grid grid-cols-2 gap-2">
                <button onclick="openPDF(${idx})" class="bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold">Open</button>
                <a href="${item.data}" download="${item.title}.pdf" class="bg-emerald-100 text-emerald-700 py-2 rounded-xl text-sm font-bold text-center">Save</a>
            </div>
            ${currentRole === 'admin' ? `<button onclick="deleteMaterial(${idx})" class="mt-4 text-red-500 text-sm underline">Delete</button>` : ''}
        </div>
    `).join('');
}

function openPDF(index) {
    document.getElementById('pdf-frame').src = uploadedMaterials[index].data;
    document.getElementById('pdf-modal').classList.remove('hidden');
}

function closePDF() {
    document.getElementById('pdf-modal').classList.add('hidden');
    document.getElementById('pdf-frame').src = "";
}

function deleteMaterial(idx) {
    uploadedMaterials.splice(idx, 1);
    localStorage.setItem('masasa_materials', JSON.stringify(uploadedMaterials));
    renderMaterials();
}
