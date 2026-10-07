(() => {
  "use strict";

  const STORAGE_KEY = "tlc-storyworks-prototype-crawl";
  const MAX_STEPS = 6;

  const STORY = [
    {
      label: "The Platform",
      text: "The station clock says 12:07. Your ticket says 12:07. There is no train listed on the departure board, but a dark train is waiting at the far platform anyway. Its windows glow with warm yellow light."
    },
    {
      label: "The First Carriage",
      text: "The doors close behind you with a soft click. Nobody asks where you are going. Instead, the conductor hands you a blank ticket and says, “You will know your stop when you have written it.”"
    },
    {
      label: "Between Stations",
      text: "Outside the window there are no towns, no roads, and no stars—only darkness. Somewhere farther down the train, a bell rings once."
    },
    {
      label: "The Last Carriage",
      text: "The train begins to slow. You see a platform outside, but the station sign has been painted over. Something about the place feels familiar."
    },
    {
      label: "The Door",
      text: "The conductor waits beside the exit. “One last thing,” they say. “Before you leave, decide what this journey was really about.”"
    },
    {
      label: "The Destination",
      text: "The doors open. The platform is quiet. Your blank ticket now has words on it—your words. Whatever happens next belongs to the story you write from here."
    }
  ];

  const ENCOUNTERS = [
    {
      kind: "sprint",
      title: "The Passenger in Seat 13",
      body: "Someone sits alone beneath a reading lamp. You have eight minutes to write the scene in which your protagonist decides whether to speak to them.",
      action: "Write for 8 minutes, then enter the number of words you wrote.",
      reward: words => words >= 400 ? { tickets: 1, clues: 1, message: "The passenger smiles. You found a clue and a ticket." } : { clues: 1, message: "The passenger smiles anyway. You found a clue." }
    },
    {
      kind: "prompt",
      title: "The Window That Remembers",
      body: "Look out the window. Write at least 250 words about a place your protagonist has never visited—but somehow remembers perfectly.",
      action: "Enter the words you wrote when you're done.",
      reward: words => words >= 250 ? { tickets: 1, message: "The remembered place leaves a ticket in your pocket." } : { message: "The memory fades, but the journey continues." }
    },
    {
      kind: "choice",
      title: "Two Doors",
      body: "At the end of the carriage are two doors. One is marked <strong>ARRIVALS</strong>. The other is marked <strong>DEPARTURES</strong>.",
      action: "Choose a door, then write 300 words about what your protagonist finds beyond it.",
      choices: [
        { label: "Arrivals", clue: 1, text: "Someone—or something—has been waiting for you." },
        { label: "Departures", ticket: 1, text: "You find a way to leave, but it leads somewhere unexpected." }
      ]
    },
    {
      kind: "constraint",
      title: "The Conductor's Rule",
      body: "The conductor gives you a strange instruction: write a scene in which <strong>nobody says the word “I.”</strong>",
      action: "Write at least 300 words. When you finish, record your word count.",
      reward: words => words >= 300 ? { tickets: 1, clues: 1, message: "You followed the rule. The conductor punches your ticket." } : { message: "The conductor lets it slide. This time." }
    },
    {
      kind: "random",
      title: "The Bell",
      body: "A bell rings. You have no idea what it means, so decide for yourself.",
      action: "Write 200 words explaining what the bell means—and make the answer matter.",
      reward: words => words >= 200 ? { clues: 1, message: "The bell's meaning becomes a clue for the final stop." } : { message: "The bell rings again. You keep moving." }
    }
  ];

  const els = {
    sceneLabel: document.getElementById("scene-label"),
    sceneText: document.getElementById("scene-text"),
    encounterLabel: document.getElementById("encounter-label"),
    encounterTitle: document.getElementById("encounter-title"),
    encounterBody: document.getElementById("encounter-body"),
    encounterPanel: document.getElementById("encounter-panel"),
    challengePanel: document.getElementById("challenge-panel"),
    challengeType: document.getElementById("challenge-type"),
    challengeTitle: document.getElementById("challenge-title"),
    challengeBody: document.getElementById("challenge-body"),
    challengeControls: document.getElementById("challenge-controls"),
    start: document.getElementById("start-button"),
    reset: document.getElementById("reset-button"),
    progressText: document.getElementById("progress-text"),
    progressCount: document.getElementById("progress-count"),
    progressFill: document.getElementById("progress-fill"),
    progressBar: document.querySelector(".progress-track"),
    tickets: document.getElementById("tickets"),
    clues: document.getElementById("clues"),
    words: document.getElementById("words"),
    status: document.getElementById("status")
  };

  let state = loadState();

  function freshState() {
    return { active: false, complete: false, step: 0, tickets: 0, clues: 0, words: 0, used: [], current: null };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === "object" ? { ...freshState(), ...saved } : freshState();
    } catch { return freshState(); }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setStatus(message) {
    els.status.textContent = message || "";
  }

  function updateStats() {
    els.tickets.textContent = state.tickets;
    els.clues.textContent = state.clues;
    els.words.textContent = state.words.toLocaleString();
  }

  function updateProgress() {
    const value = Math.min(state.step, MAX_STEPS);
    els.progressCount.textContent = value + " / " + MAX_STEPS;
    els.progressFill.style.width = (value / MAX_STEPS * 100) + "%";
    els.progressBar.setAttribute("aria-valuenow", String(value));
    els.progressText.textContent = state.complete ? "Journey complete" : value === 0 ? "The journey begins" : "The journey continues";
  }

  function renderStory(index) {
    const scene = STORY[Math.min(index, STORY.length - 1)];
    els.sceneLabel.textContent = scene.label;
    els.sceneText.innerHTML = "<p>" + scene.text + "</p>";
  }

  function chooseEncounter() {
    const available = ENCOUNTERS.filter((_, index) => !state.used.includes(index));
    const pool = available.length ? available : ENCOUNTERS;
    const index = Math.floor(Math.random() * pool.length);
    const encounter = pool[index];
    const realIndex = ENCOUNTERS.indexOf(encounter);
    state.used.push(realIndex);
    state.current = realIndex;
    return encounter;
  }

  function showEncounter(encounter) {
    els.encounterPanel.hidden = false;
    els.challengePanel.hidden = true;
    els.encounterLabel.textContent = "Random encounter";
    els.encounterTitle.textContent = encounter.title;
    els.encounterBody.innerHTML = "<p>" + encounter.body + "</p><p>" + encounter.action + "</p>";
    els.challengeControls.innerHTML = "";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary";
    button.textContent = encounter.kind === "choice" ? "Make your choice" : "Begin challenge";
    button.addEventListener("click", () => beginChallenge(encounter));
    els.challengeControls.appendChild(button);
  }

  function beginChallenge(encounter) {
    els.encounterPanel.hidden = true;
    els.challengePanel.hidden = false;
    els.challengeType.textContent = encounter.kind === "sprint" ? "Timed writing" : encounter.kind === "choice" ? "Choice + writing" : "Writing challenge";
    els.challengeTitle.textContent = encounter.title;
    els.challengeBody.innerHTML = "<p>" + encounter.body + "</p>";
    els.challengeControls.innerHTML = "";

    if (encounter.kind === "choice") {
      encounter.choices.forEach(choice => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "primary";
        button.textContent = choice.label;
        button.addEventListener("click", () => finishChallenge({ words: 300, ...choice, message: choice.text }));
        els.challengeControls.appendChild(button);
      });
      return;
    }

    const label = document.createElement("label");
    label.innerHTML = "Words written <input id=\"challenge-words\" type=\"number\" min=\"0\" inputmode=\"numeric\" value=\"0\">";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary";
    button.textContent = "Complete challenge";
    button.addEventListener("click", () => {
      const words = Math.max(0, Number(document.getElementById("challenge-words").value) || 0);
      finishChallenge({ words });
    });
    els.challengeControls.append(label, button);
    document.getElementById("challenge-words").focus();
  }

  function finishChallenge(result) {
    const encounter = ENCOUNTERS[state.current];
    state.words += result.words || 0;
    state.tickets += result.ticket ? result.ticket : 0;
    state.clues += result.clue ? result.clue : 0;

    if (encounter.reward) {
      const reward = encounter.reward(result.words || 0);
      state.tickets += reward.tickets || 0;
      state.clues += reward.clues || 0;
      setStatus(reward.message || "Challenge complete.");
    } else {
      state.tickets += result.ticket || 0;
      state.clues += result.clue || 0;
      setStatus(result.message || "Challenge complete.");
    }

    state.step++;
    save();
    updateStats();
    updateProgress();

    if (state.step >= MAX_STEPS) {
      finishCrawl();
      return;
    }

    renderStory(state.step);
    const next = chooseEncounter();
    save();
    setTimeout(() => showEncounter(next), 250);
  }

  function finishCrawl() {
    state.complete = true;
    state.active = false;
    state.current = null;
    save();
    renderStory(STORY.length - 1);
    els.encounterPanel.hidden = false;
    els.challengePanel.hidden = true;
    els.encounterLabel.textContent = "The journey is complete";
    els.encounterTitle.textContent = "You have reached the final stop.";
    els.encounterBody.innerHTML = "<p>Your ticket is covered in your own words. You leave the train carrying " + state.tickets + " ticket" + (state.tickets === 1 ? "" : "s") + " and " + state.clues + " clue" + (state.clues === 1 ? "" : "s") + ".</p><p><strong>There is only one question left: what happens next?</strong></p>";
    els.start.textContent = "Play again";
    setStatus("Crawl complete.");
  }

  function start() {
    if (state.complete) state = freshState();
    state.active = true;
    state.complete = false;
    state.step = 0;
    renderStory(0);
    const encounter = chooseEncounter();
    save();
    updateStats();
    updateProgress();
    showEncounter(encounter);
    els.start.textContent = "Restart crawl";
    setStatus("The train doors open.");
  }

  function reset() {
    state = freshState();
    save();
    renderStory(0);
    els.encounterPanel.hidden = false;
    els.challengePanel.hidden = true;
    els.encounterLabel.textContent = "Your next stop";
    els.encounterTitle.textContent = "A train waits where no train should be.";
    els.encounterBody.innerHTML = "<p>When you are ready, board the train. Your route will contain a mixture of fixed story beats and random writing challenges.</p>";
    els.start.textContent = "Board the train";
    updateStats();
    updateProgress();
    setStatus("Crawl reset.");
  }

  els.start.addEventListener("click", start);
  els.reset.addEventListener("click", reset);

  renderStory(state.complete ? STORY.length - 1 : state.step);
  updateStats();
  updateProgress();

  if (state.active && !state.complete && state.current !== null) {
    showEncounter(ENCOUNTERS[state.current]);
    els.start.textContent = "Restart crawl";
  } else if (state.complete) {
    finishCrawl();
  }
})();