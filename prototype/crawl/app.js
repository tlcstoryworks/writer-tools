try {
const __status = document.getElementById("status");
if (__status) __status.textContent = "Crawl engine is executing…";
"use strict";
const STORAGE_KEY="tlc-storyworks-prototype-crawl",MAX_STEPS=6;
const STORY=CRAWL_STORY,ENCOUNTERS=CRAWL_ENCOUNTERS;
const els={sceneLabel:document.getElementById("scene-label"),sceneText:document.getElementById("scene-text"),encounterLabel:document.getElementById("encounter-label"),encounterTitle:document.getElementById("encounter-title"),encounterBody:document.getElementById("encounter-body"),encounterPanel:document.getElementById("encounter-panel"),challengeControls:document.getElementById("challenge-controls"),start:document.getElementById("start-button"),reset:document.getElementById("reset-button"),progressText:document.getElementById("progress-text"),progressCount:document.getElementById("progress-count"),progressFill:document.getElementById("progress-fill"),progressBar:document.querySelector(".progress-track"),tickets:document.getElementById("tickets"),clues:document.getElementById("clues"),words:document.getElementById("words"),status:document.getElementById("status")};
function freshState(){return{active:false,complete:false,phase:"idle",step:0,tickets:0,clues:0,words:0,used:[],current:null,doorOutcome:null}}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return s&&typeof s==="object"?{...freshState(),...s}:freshState()}catch{return freshState()}}
let state=loadState();
let selectedChoice=null;
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{setStatus("Your browser is blocking saved crawl progress. The crawl can still continue in this tab.")}}
function setStatus(m){els.status.textContent=m||""}
function updateStats(){els.tickets.textContent=state.tickets;els.clues.textContent=state.clues;els.words.textContent=state.words.toLocaleString()}
function updateProgress(){const v=Math.min(state.step,MAX_STEPS);els.progressCount.textContent=v+" / "+MAX_STEPS;els.progressFill.style.width=v/MAX_STEPS*100+"%";els.progressBar.setAttribute("aria-valuenow",String(v));els.progressText.textContent=state.complete?"Journey complete":v===0?"The journey begins":"The journey continues"}
function getResourceOutcome(){
if(state.doorOutcome==="both")return{key:"both",door:"The conductor looks at your collection of punched tickets, then at the clues you have gathered. “You figured it out,” they say. “And you earned your way here.”",destination:"The train seems to recognize you. You spent your tickets to earn passage, and the clues you gathered let you understand why the train came for you. The door opens. What happens next belongs to the story you write from here."};
const t=state.tickets,c=state.clues;
if(t>=2&&c>=2)return{key:"both",door:"The conductor looks at your collection of punched tickets, then at the clues you have gathered. “You figured it out,” they say. “And you earned your way here.”",destination:"The train seems to recognize you. Your ticket is complete, and the pieces of the journey finally fit together. You understand why this train came for you—and you have earned the right to decide where it goes next."};
if(t>=2)return{key:"tickets",door:"The conductor studies your punched tickets. “You have earned your passage,” they say. But their expression suggests there is still something you have missed.",destination:"The doors open without resistance. You have earned your way off the train, even if some of its mysteries remain. Perhaps understanding can come later—or perhaps it belongs in the story you write next."};
if(c>=2)return{key:"clues",door:"The conductor listens as you explain what you have learned. “You understand more than most passengers do,” they say. Then they glance toward the locked door. “Understanding and permission are not quite the same thing.”",destination:"The doors open, but not quite where you expected. You understand what the train was trying to show you, even if you never quite earned a normal ticket out. The mystery follows you into whatever story comes next."};
return{key:"neither",door:"The conductor looks at your blank ticket. “You made it this far,” they say. “But perhaps you were never meant to understand the journey—or earn your way out of it.”",destination:"The doors open onto an unfamiliar platform. You leave with more questions than answers, carrying only the words you wrote along the way. Maybe that is exactly what the journey was for."};
}
function renderStory(i){
const s=STORY[Math.min(i,STORY.length-1)];
els.sceneLabel.textContent=s.label;
let text=s.text;
if(i===4)text=getResourceOutcome().door;
if(i===5)text=getResourceOutcome().destination;
els.sceneText.innerHTML="<p>"+text+"</p>";
}
function chooseEncounter(){let pool=ENCOUNTERS.filter((e,i)=>!state.used.includes(i)&&(e.minStep==null||state.step>=e.minStep)&&(e.maxStep==null||state.step<=e.maxStep));if(!pool.length)pool=ENCOUNTERS.filter((e,i)=>!state.used.includes(i));if(!pool.length)pool=ENCOUNTERS.filter((_,i)=>i!==state.current);if(!pool.length)pool=ENCOUNTERS;const e=pool[Math.floor(Math.random()*pool.length)],ri=ENCOUNTERS.indexOf(e);state.used.push(ri);state.current=ri;return e}
function showEncounter(e){
els.encounterPanel.hidden=false;
els.encounterLabel.textContent=e.kind==="choice"?"Choice encounter":e.kind==="sprint"?"Timed writing":"Writing challenge";
els.encounterTitle.textContent=e.title;
els.encounterBody.innerHTML="<div class=\"encounter-story\"><p>"+e.body+"</p><div class=\"encounter-prompt\"><p><strong>"+e.action+"</strong></p>";
els.challengeControls.innerHTML="";
const b=document.createElement("button");b.type="button";b.className="primary";b.textContent=e.kind==="choice"?"Choose your path":"Begin writing";b.addEventListener("click",()=>beginChallenge(e));els.challengeControls.appendChild(b);
}
function addWordInput(onComplete){
const l=document.createElement("label");l.className="word-entry";l.innerHTML='<span>Words written</span> <input id="challenge-words" type="number" min="0" inputmode="numeric" value="0">';
const b=document.createElement("button");b.type="button";b.className="primary";b.textContent="Complete challenge";
b.addEventListener("click",()=>{const w=Math.max(0,Number(document.getElementById("challenge-words").value)||0);onComplete(w)});
els.challengeControls.append(l,b);document.getElementById("challenge-words").focus()
}
function beginChallenge(e){
els.encounterPanel.hidden=false;
els.encounterLabel.textContent=e.kind==="choice"?"Choice encounter":e.kind==="sprint"?"Timed writing":"Writing challenge";
els.encounterTitle.textContent=e.title;
els.encounterBody.innerHTML="<div class=\"encounter-story\"><p>"+e.body+"</p><div class=\"encounter-prompt\"><p><strong>"+e.action+"</strong></p>";
els.challengeControls.innerHTML="";
if(e.kind==="choice"){
selectedChoice=null;
const choiceLead=document.createElement("p");choiceLead.className="choice-lead";choiceLead.innerHTML="<strong>Choose what your protagonist does:</strong>";els.challengeControls.appendChild(choiceLead);
e.choices.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="primary choice-button";b.textContent=c.label;b.addEventListener("click",()=>{
selectedChoice=c;const cost=c.costTicket||0,clueCost=c.costClue||0;
if(state.tickets<cost||state.clues<clueCost){setStatus("You do not have the resource required for that choice.");return}
state.tickets-=cost;state.clues-=clueCost;
els.encounterBody.innerHTML="<div class=\"encounter-story\"><p>"+e.body+"</p><div class=\"encounter-choice\"><p class=\"choice-result\"><strong>"+c.text+"</strong></p><p>"+c.instruction+"</p>";
els.challengeControls.innerHTML="";addWordInput(w=>finishChallenge({words:w,tickets:c.ticket||0,clues:c.clue||0,message:c.text}));updateStats();save()
});els.challengeControls.appendChild(b)});return}
addWordInput(w=>finishChallenge({words:w}))
}
function showResourceGate(){
state.phase="door";state.current=null;els.encounterPanel.hidden=false;els.encounterLabel.textContent="The Door";els.challengeControls.innerHTML="";
if(state.tickets<2){
els.encounterTitle.textContent="Earn Your Passage";els.encounterBody.innerHTML="<div class=\"encounter-story\"><p>The conductor holds out a hand. “Ticket.”</p><p>You show what you have. They shake their head.</p><div class=\"encounter-prompt\"><p><strong>Write at least 250 words</strong> about a moment when your protagonist earns the right to continue somewhere they were not expected to enter.</p><p>Your writing will earn you one Ticket.</p>";
addWordInput(w=>{state.words+=w;if(w>=250){state.tickets++;setStatus("The conductor punches your ticket. Passage earned.");updateStats();updateProgress();save();showResourceGate()}else{setStatus("The conductor shakes their head. You need at least 250 words to earn passage.");updateStats();save()}});return;
}
if(state.clues<2){
els.encounterTitle.textContent="Find What Is Hidden";els.encounterBody.innerHTML="<div class=\"encounter-story\"><p>The conductor studies your ticket. “You may have earned your passage,” they say, “but you still do not know enough.”</p><div class=\"encounter-prompt\"><p><strong>Write at least 250 words</strong> revealing a hidden connection between your protagonist and something they encountered on the train.</p><p>Your writing will earn you one Clue.</p>";
addWordInput(w=>{state.words+=w;if(w>=250){state.clues++;setStatus("Something clicks into place. You found a clue.");updateStats();updateProgress();save();showResourceGate()}else{setStatus("The connection is not clear enough yet. You need at least 250 words.");updateStats();save()}});return;
}
state.doorOutcome="both";state.tickets-=2;state.clues-=2;updateStats();save();setStatus("The conductor takes your tickets and studies the clues. The lock clicks.");showDoorFinalChallenge()
}
function showDoorFinalChallenge(){
state.phase="door-final";els.encounterPanel.hidden=false;els.encounterLabel.textContent="The Door";els.encounterTitle.textContent="What Was This Journey About?";els.encounterBody.innerHTML="<div class=\"encounter-story\"><p>The conductor looks at the clues you gathered, then at the blank ticket that is no longer blank.</p><p>“You have earned the right to leave,” they say. “But before you go, decide what all of this meant.”</p><div class=\"encounter-prompt\"><p><strong>Write at least 300 words</strong> connecting something your protagonist encountered on the train to the reason the train came for them.</p><p>This is not another resource check. This is the piece of the story that belongs to you.</p>";els.challengeControls.innerHTML="";
addWordInput(w=>{state.words+=w;if(w>=300){state.phase="destination";state.step=5;state.current=null;updateStats();updateProgress();save();renderStory(5);showDestinationArrival()}else{setStatus("The conductor waits. You need at least 300 words to decide what the journey meant.");updateStats();save()}})
}
function showDestinationArrival(){
els.encounterPanel.hidden=false;els.encounterLabel.textContent="The Destination";els.encounterTitle.textContent="The doors open.";els.encounterBody.innerHTML="<div class=\"encounter-story\"><p>"+getResourceOutcome().destination+"</p><div class=\"encounter-prompt\"><p><strong>Whatever happens next belongs to the story you write from here.</strong></p>";els.challengeControls.innerHTML="";const b=document.createElement("button");b.type="button";b.className="primary";b.textContent="Leave the train";b.addEventListener("click",finishCrawl);els.challengeControls.appendChild(b);setStatus("The door is open. The destination is yours.")
}
function finishChallenge(r){const e=ENCOUNTERS[state.current];state.words+=r.words||0;state.tickets+=r.tickets||r.ticket||0;state.clues+=r.clues||r.clue||0;if(e.reward){const x=e.reward(r.words||0);state.tickets+=x.tickets||0;state.clues+=x.clues||0;setStatus(x.message||"Challenge complete.")}else setStatus(r.message||"Challenge complete.");state.step++;updateStats();updateProgress();if(state.step===4){state.phase="door";state.current=null;renderStory(4);save();setTimeout(showResourceGate,500);return}if(state.step>=MAX_STEPS){finishCrawl();return}state.phase="encounter";renderStory(state.step);const n=chooseEncounter();save();setTimeout(()=>showEncounter(n),500)}
function finishCrawl(){state.step=MAX_STEPS;state.complete=true;state.active=false;state.phase="complete";state.current=null;save();updateStats();updateProgress();renderStory(STORY.length-1);els.encounterPanel.hidden=false;els.encounterLabel.textContent="The journey is complete";els.encounterTitle.textContent="You have reached the final stop.";els.encounterBody.innerHTML="<div class=\"encounter-story\"><p>Your ticket is covered in your own words. You leave the train carrying "+state.tickets+" ticket"+(state.tickets===1?"":"s")+" and "+state.clues+" clue"+(state.clues===1?"":"s")+".</p><div class=\"encounter-prompt\"><p><strong>There is only one question left: what happens next?</strong></p>";els.challengeControls.innerHTML="";els.start.textContent="Play again";setStatus("Crawl complete.")}
function start(){state=freshState();state.active=true;state.phase="encounter";state.step=1;renderStory(1);const e=chooseEncounter();updateStats();updateProgress();showEncounter(e);els.start.textContent="Restart crawl";setStatus("The train doors close behind you.");save()}
function reset(){state=freshState();selectedChoice=null;save();renderStory(0);els.encounterPanel.hidden=false;els.encounterLabel.textContent="Your next stop";els.encounterTitle.textContent="A train waits where no train should be.";els.encounterBody.innerHTML="<p>When you are ready, board the train. Your route will contain a mixture of fixed story beats and random writing challenges.</p>";els.challengeControls.innerHTML="";const b=document.createElement("button");b.type="button";b.className="primary";b.textContent="Board the train";b.addEventListener("click",start);els.challengeControls.appendChild(b);els.start.textContent="Board the train";updateStats();updateProgress();setStatus("Crawl reset.")}
function continueToDestination(){
state.step=5;
state.current=null;
save();
updateStats();
updateProgress();
renderStory(STORY.length-1);
finishCrawl();
}

els.start.addEventListener("click",start); els.reset.addEventListener("click",reset);renderStory(state.complete?STORY.length-1:state.step);updateStats();updateProgress();if(state.complete)finishCrawl();else if(state.active&&state.phase==="door"){showResourceGate()}else if(state.active&&state.phase==="door-final"){showDoorFinalChallenge()}else if(state.active&&state.phase==="destination"){showDestinationArrival()}else if(state.active&&state.current!==null){showEncounter(ENCOUNTERS[state.current]);els.start.textContent="Restart crawl"}
} catch (error) {
  const status = document.getElementById("status");
  if (status) status.textContent = "Crawl engine error: " + (error && error.message ? error.message : String(error));
  throw error;
}