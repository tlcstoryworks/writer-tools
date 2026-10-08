try {
const __status = document.getElementById("status");
if (__status) __status.textContent = "Crawl engine is executing…";
"use strict";
const STORAGE_KEY="tlc-storyworks-prototype-crawl",MAX_STEPS=6;
const STORY=[
{label:"The Platform",text:"The station clock says 12:07. Your ticket says 12:07. There is no train listed on the departure board, but a dark train is waiting at the far platform anyway. Its windows glow with warm yellow light."},
{label:"The First Carriage",text:"The doors close behind you with a soft click. Nobody asks where you are going. Instead, the conductor hands you a blank ticket and says, “You will know your stop when you have written it.”"},
{label:"Between Stations",text:"Outside the window there are no towns, no roads, and no stars—only darkness. Somewhere farther down the train, a bell rings once."},
{label:"The Last Carriage",text:"The train begins to slow. You see a platform outside, but the station sign has been painted over. Something about the place feels familiar."},
{label:"The Door",text:"The conductor waits beside the exit. “One last thing,” they say. “Before you leave, decide what this journey was really about.”"},
{label:"The Destination",text:"The doors open. The platform is quiet. Your blank ticket now has words on it—your words. Whatever happens next belongs to the story you write from here."}];
const ENCOUNTERS=[
{kind:"sprint",title:"The Passenger in Seat 13",body:"Someone sits alone beneath a reading lamp. You have eight minutes to write the scene in which your protagonist decides whether to speak to them.",action:"Write for 8 minutes, then enter the number of words you wrote.",reward:w=>w>=400?{tickets:1,clues:1,message:"The passenger smiles. You found a clue and a ticket."}:w>=200?{clues:1,message:"The passenger answers one question. You found a clue."}:{message:"The passenger turns back to their book. You keep moving."}},
{kind:"prompt",title:"The Window That Remembers",body:"Look out the window. Write at least 250 words about a place your protagonist has never visited—but somehow remembers perfectly.",action:"Enter the words you wrote when you're done.",reward:w=>w>=400?{tickets:1,clues:1,message:"The remembered place feels almost real. It leaves you a clue and a ticket."}:w>=250?{tickets:1,message:"The remembered place leaves a ticket in your pocket."}:{message:"The memory fades, but the journey continues."}},
{kind:"choice",title:"Two Doors",body:"At the end of the carriage are two doors. One is marked <strong>ARRIVALS</strong>. The other is marked <strong>DEPARTURES</strong>.",action:"Choose a door, then write 300 words about what your protagonist finds beyond it.",choices:[{label:"Arrivals",clue:1,text:"Someone—or something—has been waiting for you.",instruction:"Write 300 words about what has been waiting, and why it knows your protagonist."},{label:"Departures",ticket:1,text:"You find a way to leave, but it leads somewhere unexpected.",instruction:"Write 300 words about where the unexpected departure takes your protagonist."}]},
{kind:"constraint",title:"The Conductor's Rule",body:"The conductor gives you a strange instruction: write a scene in which <strong>nobody says the word “I.”</strong>",action:"Write at least 300 words. When you finish, record your word count.",reward:w=>w>=500?{tickets:1,clues:2,message:"You followed the rule so completely that the conductor punches two tickets into your hand—and gives you a clue."}:w>=300?{tickets:1,clues:1,message:"You followed the rule. The conductor punches your ticket and whispers a clue."}:{message:"The conductor lets it slide. This time."}},
{kind:"random",title:"The Bell",body:"A bell rings. You have no idea what it means, so decide for yourself.",action:"Write 200 words explaining what the bell means—and make the answer matter later in the story.",reward:w=>w>=350?{clues:2,message:"The bell's meaning becomes impossible to ignore. You found two clues."}:w>=200?{clues:1,message:"The bell's meaning becomes a clue for the final stop."}:{message:"The bell rings again. You keep moving."}},
{kind:"prompt",title:"The Empty Seat",body:"One seat across the aisle is empty, but someone has left something behind. Decide what it is and why your protagonist cannot leave it there.",action:"Write at least 250 words. When you finish, record your word count.",reward:w=>w>=400?{tickets:1,clues:1,message:"Whatever was left behind seems to know more than it should. You keep it—and find a ticket."}:w>=250?{clues:1,message:"Whatever was left behind seems to know more than it should."}:{message:"You leave the object where you found it. For now."}},
{kind:"constraint",title:"The Announcement",body:"The speakers crackle to life. Write a scene in which your protagonist hears an announcement that changes what they thought this journey was about.",action:"Write at least 300 words, and include the exact phrase “next stop.” Check your own draft before completing the challenge.",reward:w=>w>=500?{tickets:2,message:"The announcement gives you two tickets to somewhere unexpected."}:w>=300?{tickets:1,message:"The announcement gives you a ticket to somewhere unexpected."}:{message:"The speakers fall silent before the announcement is complete."}},
{kind:"sprint",title:"The Reflection",body:"The window catches your protagonist's reflection—but for one moment, it moves differently. You have six minutes to find out why.",action:"Write for 6 minutes, then enter the number of words you wrote.",reward:w=>w>=500?{tickets:1,clues:2,message:"The reflection finally moves with you. It leaves behind two clues and a ticket."}:w>=300?{tickets:1,clues:1,message:"The reflection finally moves with you. It leaves behind a clue and a ticket."}:w>=150?{clues:1,message:"The reflection stops moving. You found a clue, but not an answer."}:{message:"The reflection stops moving. Whatever it was, it isn't following you."}}
];
const els={sceneLabel:document.getElementById("scene-label"),sceneText:document.getElementById("scene-text"),encounterLabel:document.getElementById("encounter-label"),encounterTitle:document.getElementById("encounter-title"),encounterBody:document.getElementById("encounter-body"),encounterPanel:document.getElementById("encounter-panel"),challengePanel:document.getElementById("challenge-panel"),challengeType:document.getElementById("challenge-type"),challengeTitle:document.getElementById("challenge-title"),challengeBody:document.getElementById("challenge-body"),challengeControls:document.getElementById("challenge-controls"),start:document.getElementById("start-button"),reset:document.getElementById("reset-button"),progressText:document.getElementById("progress-text"),progressCount:document.getElementById("progress-count"),progressFill:document.getElementById("progress-fill"),progressBar:document.querySelector(".progress-track"),tickets:document.getElementById("tickets"),clues:document.getElementById("clues"),words:document.getElementById("words"),status:document.getElementById("status")};
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
function chooseEncounter(){let pool=ENCOUNTERS.filter((_,i)=>!state.used.includes(i));if(!pool.length)pool=ENCOUNTERS.filter((_,i)=>i!==state.current);if(!pool.length)pool=ENCOUNTERS;const e=pool[Math.floor(Math.random()*pool.length)],ri=ENCOUNTERS.indexOf(e);state.used.push(ri);state.current=ri;return e}
function showEncounter(e){els.encounterPanel.hidden=false;els.challengePanel.hidden=true;els.encounterLabel.textContent="Random encounter";els.encounterTitle.textContent=e.title;els.encounterBody.innerHTML="<p>"+e.body+"</p><p>"+e.action+"</p>";els.challengeControls.innerHTML="";const b=document.createElement("button");b.type="button";b.className="primary";b.textContent=e.kind==="choice"?"Choose a door":"Begin challenge";b.addEventListener("click",()=>beginChallenge(e));els.encounterBody.appendChild(b)}
function addWordInput(onComplete){const l=document.createElement("label");l.innerHTML='<span>Words written</span> <input id="challenge-words" type="number" min="0" inputmode="numeric" value="0">';const b=document.createElement("button");b.type="button";b.className="primary";b.textContent="Complete challenge";b.addEventListener("click",()=>{const w=Math.max(0,Number(document.getElementById("challenge-words").value)||0);onComplete(w)});els.challengeControls.append(l,b);document.getElementById("challenge-words").focus()}
function beginChallenge(e){els.encounterPanel.hidden=true;els.challengePanel.hidden=false;els.challengeType.textContent=e.kind==="sprint"?"Timed writing":e.kind==="choice"?"Choice + writing":"Writing challenge";els.challengeTitle.textContent=e.title;els.challengeBody.innerHTML="<p>"+e.body+"</p>";els.challengeControls.innerHTML="";
if(e.kind==="choice"){selectedChoice=null;e.choices.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="primary";b.textContent=c.label;b.addEventListener("click",()=>{selectedChoice=c;els.challengeBody.innerHTML="<p>"+c.text+"</p><p>"+c.instruction+"</p>";els.challengeControls.innerHTML="";addWordInput(w=>finishChallenge({words:w,tickets:c.ticket||0,clues:c.clue||0,message:c.text}))});els.challengeControls.appendChild(b)});return}
addWordInput(w=>finishChallenge({words:w}))}
function showResourceGate(){
state.phase="door";
state.current=null;
els.encounterPanel.hidden=true;
els.challengePanel.hidden=false;
els.challengeType.textContent="The Door";
els.challengeControls.innerHTML="";
if(state.tickets<2){
els.challengeTitle.textContent="Earn Your Passage";
els.challengeBody.innerHTML="<p>The conductor holds out a hand. “Ticket.”</p><p>You show what you have. They shake their head.</p><p><strong>Write at least 250 words</strong> about a moment when your protagonist earns the right to continue somewhere they were not expected to enter.</p><p>Your writing will earn you one Ticket.</p>";
addWordInput(w=>{
state.words+=w;
if(w>=250){state.tickets++;setStatus("The conductor punches your ticket. Passage earned.");updateStats();updateProgress();save();showResourceGate()}
else{setStatus("The conductor shakes their head. You need at least 250 words to earn passage.");updateStats();save()}
});
return;
}
if(state.clues<2){
els.challengeTitle.textContent="Find What Is Hidden";
els.challengeBody.innerHTML="<p>The conductor studies your ticket. “You may have earned your passage,” they say, “but you still do not know enough.”</p><p><strong>Write at least 250 words</strong> revealing a hidden connection between your protagonist and something they encountered on the train.</p><p>Your writing will earn you one Clue.</p>";
addWordInput(w=>{
state.words+=w;
if(w>=250){state.clues++;setStatus("Something clicks into place. You found a clue.");updateStats();updateProgress();save();showResourceGate()}
else{setStatus("The connection is not clear enough yet. You need at least 250 words.");updateStats();save()}
});
return;
}
state.doorOutcome="both";
state.tickets-=2;
state.clues-=2;
updateStats();
save();
setStatus("The conductor takes your tickets and studies the clues. The lock clicks.");
showDoorFinalChallenge();
}
function showDoorFinalChallenge(){
state.phase="door-final";
els.encounterPanel.hidden=true;
els.challengePanel.hidden=false;
els.challengeType.textContent="The Door";
els.challengeTitle.textContent="What Was This Journey About?";
els.challengeBody.innerHTML="<p>The conductor looks at the clues you gathered, then at the blank ticket that is no longer blank.</p><p>“You have earned the right to leave,” they say. “But before you go, decide what all of this meant.”</p><p><strong>Write at least 300 words</strong> connecting something your protagonist encountered on the train to the reason the train came for them.</p><p>This is not another resource check. This is the piece of the story that belongs to you.</p>";
els.challengeControls.innerHTML="";
addWordInput(w=>{
state.words+=w;
if(w>=300){
state.phase="destination";
state.step=5;
state.current=null;
updateStats();
updateProgress();
save();
renderStory(5);
showDestinationArrival();
}else{
setStatus("The conductor waits. You need at least 300 words to decide what the journey meant.");
updateStats();
save();
}
});
}
function showDestinationArrival(){
els.encounterPanel.hidden=false;
els.challengePanel.hidden=true;
els.encounterLabel.textContent="The Destination";
els.encounterTitle.textContent="The doors open.";
els.encounterBody.innerHTML="<p>"+getResourceOutcome().destination+"</p><p><strong>Whatever happens next belongs to the story you write from here.</strong></p>";
els.challengeControls.innerHTML="";
const b=document.createElement("button");
b.type="button";
b.className="primary";
b.textContent="Leave the train";
b.addEventListener("click",finishCrawl);
els.encounterBody.appendChild(b);
setStatus("The door is open. The destination is yours.");
}
function continueToDestination(){
state.step=5;
state.current=null;
save();
updateStats();
updateProgress();
renderStory(STORY.length-1);
finishCrawl();
}
function finishChallenge(r){const e=ENCOUNTERS[state.current];state.words+=r.words||0;state.tickets+=r.tickets||r.ticket||0;state.clues+=r.clues||r.clue||0;if(e.reward){const x=e.reward(r.words||0);state.tickets+=x.tickets||0;state.clues+=x.clues||0;setStatus(x.message||"Challenge complete.")}else setStatus(r.message||"Challenge complete.");state.step++;updateStats();updateProgress();if(state.step===4){state.phase="door";state.current=null;renderStory(4);save();setTimeout(showResourceGate,500);return}if(state.step>=MAX_STEPS){finishCrawl();return}state.phase="encounter";renderStory(state.step);const n=chooseEncounter();save();setTimeout(()=>showEncounter(n),500)}
function finishCrawl(){state.step=MAX_STEPS;state.complete=true;state.active=false;state.phase="complete";state.current=null;save();updateStats();updateProgress();renderStory(STORY.length-1);els.encounterPanel.hidden=false;els.challengePanel.hidden=true;els.encounterLabel.textContent="The journey is complete";els.encounterTitle.textContent="You have reached the final stop.";els.encounterBody.innerHTML="<p>Your ticket is covered in your own words. You leave the train carrying "+state.tickets+" ticket"+(state.tickets===1?"":"s")+" and "+state.clues+" clue"+(state.clues===1?"":"s")+".</p><p><strong>There is only one question left: what happens next?</strong></p>";els.start.textContent="Play again";setStatus("Crawl complete.")}
function start(){state=freshState();state.active=true;state.phase="encounter";renderStory(0);const e=chooseEncounter();updateStats();updateProgress();showEncounter(e);els.start.textContent="Restart crawl";setStatus("The train doors open.");save()}
function reset(){state=freshState();selectedChoice=null;save();renderStory(0);els.encounterPanel.hidden=false;els.challengePanel.hidden=true;els.encounterLabel.textContent="Your next stop";els.encounterTitle.textContent="A train waits where no train should be.";els.encounterBody.innerHTML="<p>When you are ready, board the train. Your route will contain a mixture of fixed story beats and random writing challenges.</p>";els.start.textContent="Board the train";updateStats();updateProgress();setStatus("Crawl reset.")}
els.start.addEventListener("click",start); els.reset.addEventListener("click",reset);renderStory(state.complete?STORY.length-1:state.step);updateStats();updateProgress();if(state.complete)finishCrawl();else if(state.active&&state.phase==="door"){showResourceGate()}else if(state.active&&state.phase==="door-final"){showDoorFinalChallenge()}else if(state.active&&state.phase==="destination"){showDestinationArrival()}else if(state.active&&state.current!==null){showEncounter(ENCOUNTERS[state.current]);els.start.textContent="Restart crawl"}
} catch (error) {
  const status = document.getElementById("status");
  if (status) status.textContent = "Crawl engine error: " + (error && error.message ? error.message : String(error));
  throw error;
}