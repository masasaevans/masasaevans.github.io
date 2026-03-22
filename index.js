// 1. UPDATED RENDER FUNCTION
function renderMaterials() {
    const container = document.getElementById('assignments-section');
    if (uploadedMaterials.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-400 py-12">No learning materials uploaded yet.</p>`;
        return;
    }

    container.innerHTML = uploadedMaterials.map((item, idx) => `
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all animate-fade-in relative">
            <div class="text-4xl mb-3">📚</div>
            <h4 class="font-bold text-lg mb-1 truncate">${item.title}</h4>
            <p class="text-xs text-gray-400 mb-4">Uploaded: ${item.date}</p>
            
            <div class="grid grid-cols-2 gap-2">
                <button onclick="openPDF(${idx})" class="bg-indigo-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-indigo-700">Open</button>
                
                <a href="${item.data}" download="${item.title}.pdf" class="bg-emerald-100 text-emerald-700 py-2 rounded-xl font-bold text-sm text-center hover:bg-emerald-200">Save</a>
            </div>

            ${currentRole === 'admin' ? `
                <button onclick="deleteMaterial(${idx})" class="absolute top-4 right-4 text-red-300 hover:text-red-500">🗑️</button>
            ` : ''}
        </div>
    `).join('');
}

// 2. OPEN PDF LOGIC
function openPDF(index) {
    const item = uploadedMaterials[index];
    const modal = document.getElementById('pdf-modal');
    const frame = document.getElementById('pdf-frame');
    const title = document.getElementById('pdf-modal-title');

    title.textContent = `Reading: ${item.title}`;
    frame.src = item.data; // This loads the Base64 data into the iframe
    modal.classList.remove('hidden');
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

// 3. CLOSE PDF LOGIC (Return to Homepage)
function closePDF() {
    const modal = document.getElementById('pdf-modal');
    const frame = document.getElementById('pdf-frame');
    
    modal.classList.add('hidden');
    frame.src = ""; // Clear the frame to save memory
    
    // Re-enable background scrolling
    document.body.style.overflow = 'auto';
    
    // Ensure we are showing the assignments tab
    switchTab('assignments');
}
