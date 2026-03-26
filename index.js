// STORAGE
let announcements = JSON.parse(localStorage.getItem("announcements")) || ["Welcome to LearnSphere"];
let mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
let pdfs = JSON.parse(localStorage.getItem("pdfs")) || [];

// BUBBLES
function createBubbles(){
    const container = document.getElementById("bubbles");
    container.innerHTML = "";

    for(let i=0;i<20;i++){
        let b=document.createElement("div");
        let size=Math.random()*50+10;
        b.style.width=size+"px";
        b.style.height=size+"px";
        b.style.left=Math.random()*100+"vw";
        container.appendChild(b);
    }
}

// TIME
function updateTime(){
    let now=new Date();
    document.getElementById("day").innerText = now.toDateString();
    document.getElementById("date").innerText = now.toLocaleDateString();
    document.getElementById("time").innerText = now.toLocaleTimeString();
}

// MARQUEE
function setupMarquee(){
    let text = announcements.join(" • ");
    document.getElementById("top-marquee").innerText = text;
    document.getElementById("bottom-marquee").innerText = text;
}

// ADMIN (TRIPLE CLICK)
let clickCount = 0;
let timer;

document.addEventListener("click", () => {
    clickCount++;
    if(clickCount === 1){
        timer = setTimeout(()=>clickCount=0,600);
    }
    if(clickCount === 3){
        clearTimeout(timer);
        clickCount = 0;
        toggleAdmin();
    }
});

function toggleAdmin(){
    document.getElementById("admin").classList.toggle("hidden");
}

// ANNOUNCEMENTS
function addAnnouncement(){
    let val = document.getElementById("announcement-input").value.trim();
    if(!val) return;

    announcements.push(val);
    localStorage.setItem("announcements", JSON.stringify(announcements));
    document.getElementById("announcement-input").value="";
    setupMarquee();
}

// PDF
function uploadPDF(){
    let file = document.getElementById("file-input").files[0];
    let name = document.getElementById("file-name").value;

    if(!file) return alert("Select file");

    let reader=new FileReader();
    reader.onload=function(e){
        pdfs.push({name,data:e.target.result});
        localStorage.setItem("pdfs",JSON.stringify(pdfs));
        renderPDF();
    };
    reader.readAsDataURL(file);
}

function renderPDF(){
    let grid=document.getElementById("extended-grid");
    grid.innerHTML="";

    pdfs.forEach(p=>{
        let btn=document.createElement("button");
        btn.innerText=p.name;
        btn.onclick=()=>window.open(p.data);
        grid.appendChild(btn);
    });
}

// MCQ
function addMCQ(){
    let q=document.getElementById("mcq-question").value;
    let opts=[...document.querySelectorAll(".mcq-option")].map(x=>x.value);
    let ans=parseInt(document.getElementById("mcq-answer").value)-1;

    if(!q || opts.some(o=>!o) || isNaN(ans)){
        alert("Fill all MCQ fields");
        return;
    }

    mcqs.push({q,opts,ans});
    localStorage.setItem("mcqs",JSON.stringify(mcqs));
    alert("MCQ added!");
}

// LOAD MCQ
function loadMCQ(){
    let box=document.getElementById("mcq-area");
    box.innerHTML="";

    mcqs.forEach((m,i)=>{
        let div=document.createElement("div");
        div.innerHTML=`<p>${m.q}</p>`+
        m.opts.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}">${o}</label>`).join("");
        box.appendChild(div);
    });

    let btn=document.createElement("button");
    btn.innerText="Submit";
    btn.onclick=submitMCQ;
    box.appendChild(btn);
}

function submitMCQ(){
    let score=0;

    mcqs.forEach((m,i)=>{
        let sel=document.querySelector(`input[name="q${i}"]:checked`);
        if(sel && parseInt(sel.value)===m.ans) score++;
    });

    alert("Score: "+score+"/"+mcqs.length);
}

// NAV
function showSection(section){
    document.getElementById("extended-section").classList.add("hidden");
    document.getElementById("assessment-section").classList.add("hidden");

    document.getElementById(section+"-section").classList.remove("hidden");

    if(section==="assessment") loadMCQ();
}

// INIT
window.onload = () => {
    createBubbles();
    updateTime();
    setInterval(updateTime,1000);
    setupMarquee();
    renderPDF();
};
