// STORAGE
let announcements = JSON.parse(localStorage.getItem("announcements")) || ["Welcome to LearnSphere"];
let mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
let pdfs = JSON.parse(localStorage.getItem("pdfs")) || [];

// BUBBLES
function createBubbles(){
    const container = document.getElementById("bubbles");
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
    day.innerText=now.toDateString();
    date.innerText=now.toLocaleDateString();
    time.innerText=now.toLocaleTimeString();
}

// MARQUEE
function setupMarquee(){
    let text=announcements.join(" • ");
    top-marquee.innerText=text;
    bottom-marquee.innerText=text;
}

// ADMIN TOGGLE
document.addEventListener("click",()=>{
    if(event.detail===3){
        toggleAdmin();
    }
});

function toggleAdmin(){
    admin.classList.toggle("hidden");
}

// ANNOUNCEMENTS
function addAnnouncement(){
    let val=document.getElementById("announcement-input").value;
    announcements.push(val);
    localStorage.setItem("announcements",JSON.stringify(announcements));
    setupMarquee();
}

// PDF
function uploadPDF(){
    let file=document.getElementById("file-input").files[0];
    let name=document.getElementById("file-name").value;

    let reader=new FileReader();
    reader.onload=function(e){
        pdfs.push({name, data:e.target.result});
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

    mcqs.push({q,opts,ans});
    localStorage.setItem("mcqs",JSON.stringify(mcqs));
}

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
        let sel=document.querySelector(`input[name=q${i}]:checked`);
        if(sel && parseInt(sel.value)===m.ans) score++;
    });
    alert("Score: "+score+"/"+mcqs.length);
}

// NAV
function showSection(s){
    extended-section.classList.add("hidden");
    assessment-section.classList.add("hidden");

    document.getElementById(s+"-section").classList.remove("hidden");

    if(s==="assessment") loadMCQ();
}

// INIT
window.onload=()=>{
    createBubbles();
    updateTime();
    setInterval(updateTime,1000);
    setupMarquee();
    renderPDF();
};
