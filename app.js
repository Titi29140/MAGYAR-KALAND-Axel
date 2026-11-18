const STORAGE_KEY="magyar-kaland-progress-v1";
const lessonsData=window.LESSONS_DATA;
let state=loadState();
let deferredPrompt=null;
let currentQuestion=0,selectedAnswer=null,answered=false;
const quizBank=lessonsData.map(l=>({...l.quiz,lessonId:l.id}));
const $=id=>document.getElementById(id);
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{stars:0,completed:[],known:[],review:[],lastDay:null,streak:0,quizDone:[]}}catch(e){return {stars:0,completed:[],known:[],review:[],lastDay:null,streak:0,quizDone:[]}}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderStats();renderLessons();renderProgress()}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function renderStats(){$("stars").textContent=state.stars;$("doneCount").textContent=state.completed.length;$("streak").textContent=state.streak;$("progressStars").textContent=state.stars;$("progressLessons").textContent=state.completed.length+"/"+lessonsData.length;$("knownWords").textContent=state.known.length;$("levelLabel").textContent=state.completed.length<3?"Niveau 1 · Explorateur":state.completed.length<7?"Niveau 2 · Aventurier":"Niveau 3 · Champion"}
function renderLessons(){const grid=$("lessonGrid");grid.innerHTML="";lessonsData.forEach((l,i)=>{const done=state.completed.includes(l.id),unlocked=i===0||state.completed.includes(lessonsData[i-1].id);const card=document.createElement("article");card.className="lesson"+(!unlocked?" locked":"");card.innerHTML=`<div class="lesson-top"><span class="lesson-emoji">${l.emoji}</span><span class="lesson-tag">${done?"✓ TERMINÉE":unlocked?"MISSION "+l.id:"🔒 VERROUILLÉE"}</span></div><h3>${l.title}</h3><p>${l.desc}</p><button class="${done?"secondary":"primary"}" ${!unlocked?"disabled":""}>${done?"Revoir la leçon":unlocked?"Commencer →":"À débloquer"}</button>`;card.querySelector("button").addEventListener("click",()=>openLesson(l));grid.appendChild(card)})}
function renderProgress(){$("badges").innerHTML=[["🌱","Premiers pas",state.completed.length>=1],["🦊","Petit explorateur",state.completed.length>=3],["🏅","Aventurier",state.completed.length>=5],["👑","Champion hongrois",state.completed.length>=10]].map(b=>`<span class="badge ${b[2]?"":"off"}">${b[0]} ${b[1]}</span>`).join("");const words=state.review.length?state.review.map(w=>`<span class="word-chip">${w}</span>`).join(""):"<span class='muted'>Pas encore de mot à revoir. Continue comme ça !</span>";$("reviewWords").innerHTML=words}
function showTab(name){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===name));if(name==="practice")showQuestion()}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
async function speak(text,lang){
  const status=$("voiceStatus");
  if(!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)){
    if(status)status.textContent="Ce navigateur ne prend pas en charge la lecture vocale. Essaie avec Google Chrome à jour.";
    toast("Lecture vocale non prise en charge par ce navigateur.");return;
  }
  const synth=window.speechSynthesis;
  synth.cancel();
  if(status)status.textContent="Recherche d'une voix " + (lang.startsWith("hu")?"hongroise":"française") + "…";
  // Chrome peut fournir la liste des voix quelques instants après le chargement de la page.
  let voices=synth.getVoices();
  if(!voices.length){
    await new Promise(resolve=>{
      let finished=false;
      const done=()=>{if(finished)return;finished=true;synth.removeEventListener("voiceschanged",done);resolve();};
      synth.addEventListener("voiceschanged",done);
      setTimeout(done,1800);
    });
    voices=synth.getVoices();
  }
  const wanted=lang.toLowerCase();
  const voice=voices.find(v=>v.lang && v.lang.toLowerCase()===wanted)
    || voices.find(v=>v.lang && v.lang.toLowerCase().startsWith(wanted.slice(0,2)));
  const u=new SpeechSynthesisUtterance(text);
  u.lang=lang;u.rate=.83;u.volume=1;u.pitch=1;
  if(voice)u.voice=voice;
  u.onstart=()=>{if(status)status.textContent="Lecture en cours : "+(voice?voice.name+" ("+voice.lang+")":"voix par défaut du navigateur")+". Voix détectées : "+voices.length+".";};
  u.onend=()=>{if(status)status.textContent="Lecture terminée. Voix détectées : "+voices.length+". Français : "+(voices.some(v=>v.lang&&v.lang.toLowerCase().startsWith("fr"))?"oui":"non")+" · Hongrois : "+(voices.some(v=>v.lang&&v.lang.toLowerCase().startsWith("hu"))?"oui":"non");};
  u.onerror=(event)=>{const reason=event.error||"erreur inconnue";if(status)status.textContent="La lecture a échoué ("+reason+"). Voix détectées : "+voices.length+". Vérifie le volume de Windows et les voix vocales installées.";toast("Impossible de lancer la voix : "+reason);};
  try{ synth.speak(u); }
  catch(err){if(status)status.textContent="Erreur de lecture : "+err.message;toast("Erreur de lecture vocale.");}
  if(!voice && status)status.textContent="Aucune voix "+(lang.startsWith("hu")?"hongroise":"française")+" repérée. Essai avec la voix par défaut du navigateur… ("+voices.length+" voix détectées)";
}
function openLesson(l){let idx=0;const overlay=document.createElement("div");overlay.className="lesson-overlay";overlay.innerHTML=`<div class="lesson-modal"><button class="close-modal" aria-label="Fermer">✕</button><p class="eyebrow">MISSION ${l.id} · ${l.theme.toUpperCase()}</p><div class="modal-progress"><span></span></div><div class="modal-body"></div><div class="modal-actions"><button class="secondary prev" disabled>← Retour</button><button class="primary next">Suivant →</button></div></div>`;document.body.appendChild(overlay);const body=overlay.querySelector(".modal-body"),bar=overlay.querySelector(".modal-progress span"),prev=overlay.querySelector(".prev"),next=overlay.querySelector(".next");function render(){bar.style.width=((idx+1)/(l.words.length+1)*100)+"%";if(idx<l.words.length){const w=l.words[idx];body.innerHTML=`<div class="word-art">${w[2]}</div><p class="eyebrow">MOT ${idx+1} SUR ${l.words.length}</p><h2>${w[0]}</h2><div class="hu-word">${w[1]}</div><p class="muted">Écoute bien, puis répète à voix haute.</p><div class="button-row centered"><button class="secondary speak-fr">🔊 Français</button><button class="primary speak-hu">🔊 Hongrois</button></div><p class="tiny-note">Astuce : en hongrois, l'accent tonique tombe généralement sur la première syllabe.</p>`;body.querySelector(".speak-fr").onclick=()=>speak(w[0],"fr-FR");body.querySelector(".speak-hu").onclick=()=>speak(w[1],"hu-HU")}else{body.innerHTML=`<div class="word-art">🎉</div><p class="eyebrow">MISSION TERMINÉE</p><h2>À toi de jouer !</h2><p>Associe le mot hongrois à sa traduction.</p><h3>${l.quiz.q}</h3><div class="choices lesson-choices">${l.quiz.choices.map(c=>`<button class="choice">${c}</button>`).join("")}</div><div class="feedback"></div>`;body.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{body.querySelectorAll(".choice").forEach(x=>x.disabled=true);const ok=b.textContent===l.quiz.a;b.classList.add(ok?"correct":"wrong");body.querySelector(".feedback").textContent=ok?"Bravo ! ⭐":"La bonne réponse : "+l.quiz.a;if(ok){state.stars+=2;if(!state.completed.includes(l.id))state.completed.push(l.id);l.words.forEach(w=>{if(!state.known.includes(w[1]))state.known.push(w[1]);state.review=state.review.filter(x=>x!==w[1])});save()}next.textContent="Terminer ✓";next.disabled=false})}prev.disabled=idx===0;next.textContent=idx===l.words.length?"Terminer":"Suivant →";next.disabled=idx===l.words.length}
prev.onclick=()=>{if(idx>0){idx--;render()}};next.onclick=()=>{if(idx<l.words.length){idx++;render()}else{overlay.remove();save();toast("Mission terminée ! Bravo Axel ! ⭐")}};overlay.querySelector(".close-modal").onclick=()=>overlay.remove();overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};render()}
function showQuestion(){const q=quizBank[currentQuestion%quizBank.length];selectedAnswer=null;answered=false;$("practiceEmoji").textContent=q.emoji;$("practiceType").textContent="MISSION "+q.lessonId+" · MINI-DÉFI";$("question").textContent=q.q;$("feedback").textContent="";$("nextQuestion").disabled=true;$("choices").innerHTML=q.choices.map(c=>`<button class="choice">${c}</button>`).join("");$("choices").querySelectorAll("button").forEach(b=>b.onclick=()=>{if(answered)return;answered=true;selectedAnswer=b.textContent;const ok=selectedAnswer===q.a;b.classList.add(ok?"correct":"wrong");$("choices").querySelectorAll("button").forEach(x=>x.disabled=true);$("feedback").textContent=ok?"Excellent ! +1 étoile ⭐":"La bonne réponse était : "+q.a;if(ok){state.stars++;state.quizDone.push(q.lessonId);save()}else{const lesson=lessonsData.find(l=>l.id===q.lessonId);state.review.push(lesson.words[0][1]);state.review=[...new Set(state.review)];save()}$("nextQuestion").disabled=false})}
$("nextQuestion").onclick=()=>{currentQuestion++;showQuestion()};
$("testFr").onclick=()=>speak("Bonjour Axel, bienvenue dans ton aventure hongroise !","fr-FR");
$("testHu").onclick=()=>speak("Szia Axel! Üdvözöllek a magyar kalandban!","hu-HU");
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({app:"MAGYAR KALAND",version:1,exportedAt:new Date().toISOString(),progress:state},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="magyar-kaland-sauvegarde.json";a.click();URL.revokeObjectURL(a.href);toast("Sauvegarde exportée !")};
$("importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.app!=="MAGYAR KALAND"||!data.progress)throw Error();state={...state,...data.progress};save();toast("Progression importée !")}catch(err){toast("Fichier de sauvegarde non reconnu.")}e.target.value=""};
$("resetBtn").onclick=()=>{if(confirm("Effacer toutes les étoiles et les missions terminées sur cet appareil ?")){state={stars:0,completed:[],known:[],review:[],lastDay:null,streak:0,quizDone:[]};save();toast("Progression réinitialisée.")}};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").hidden=false});
$("installBtn").onclick=async()=>{if(!deferredPrompt){toast("Utilise le menu du navigateur pour installer.");return}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").hidden=true};
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
renderStats();renderLessons();renderProgress();