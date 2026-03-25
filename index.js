// ===== UPLOAD PDF =====
async function uploadPDF() {
  const title = document.getElementById("pdf-title").value;
  const file = document.getElementById("pdf-file").files[0];
  if (!file) return alert("Please select a PDF");

  const storageRef = ref(storage, "materials/" + file.name);
  try {
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, "materials"), { title, url, created: Date.now() });
    alert("PDF uploaded successfully ✅");
    loadMaterials();
  } catch (err) {
    alert("Upload failed ❌\n" + err.message);
  }
}

// ===== QUIZ SYSTEM =====
let questions = [];
function addQuestion() {
  questions.push({
    q: "Sample question?",
    options: ["A","B","C","D"],
    correct: 0
  });
  alert("Sample question added");
}

async function publishQuiz() {
  const title = document.getElementById("quiz-title").value;
  if (!title) return alert("Please enter quiz title");

  try {
    await addDoc(collection(db, "quizzes"), { title, questions });
    questions = [];
    alert("Quiz published ✅");
    loadQuizzes();
  } catch (err) {
    alert("Quiz publish failed ❌\n" + err.message);
  }
}
