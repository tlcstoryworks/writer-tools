(() => {
  "use strict";

  const STORAGE_KEY = "tlc-storyworks-public-pomodoro";
  const THEME_STORAGE_KEY = "tlc-storyworks-theme";
  const SOUND_STORAGE_KEY = "tlc-storyworks-pomodoro-sound";
  const params = new URLSearchParams(location.search);
  const viewerMode = params.has("viewer");

  if (viewerMode) document.body.classList.add("viewer");

  const PRESETS = {
    classic: { name: "Classic Pomodoro", work: 25, break: 5, rounds: 4, longBreak: 15 },
    short: { name: "Short Pomodoro", work: 15, break: 5, rounds: 4, longBreak: 15 },
    long: { name: "Long Focus", work: 50, break: 10, rounds: 3, longBreak: 20 }
  };

  const $ = id => document.getElementById(id);
  let presetKey = "classic";
  let stages = [];
  let audioContext = null;
  let soundEnabled = true;
  let soundVolume = 0.55;
  const state = { stageIndex: 0, remaining: 0, running: false, lastTick: null, lastTimeLabel: null };

  function announce(message) {
    $("timer-status").textContent = "";
    requestAnimationFrame(() => { $("timer-status").textContent = message; });
  }
  function formatTime(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
  }
  function screenTime(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(seconds / 60), secs = seconds % 60, parts = [];
    if (minutes) parts.push(minutes + (minutes === 1 ? " minute" : " minutes"));
    if (secs || !minutes) parts.push(secs + (secs === 1 ? " second" : " seconds"));
    return parts.join(" ");
  }
  function buildStages() {
    const p = PRESETS[presetKey]; stages = [];
    for (let round = 1; round <= p.rounds; round += 1) {
      stages.push({ name: "Writing", minutes: p.work, writing: true, round });
      if (round < p.rounds) stages.push({ name: "Break", minutes: p.break, writing: false, round });
    }
    stages.push({ name: "Long Break", minutes: p.longBreak, writing: false, round: p.rounds });
  }
  function savePreset() { localStorage.setItem(STORAGE_KEY, presetKey); }
  function loadPreset() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && PRESETS[saved]) presetKey = saved;
  }
  function getThemePreset() {
    const requested = params.get("theme");
    if (requested) return requested;
    try { return JSON.parse(localStorage.getItem(THEME_STORAGE_KEY))?.preset || "neutral"; }
    catch { return "neutral"; }
  }
  function loadSoundSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SOUND_STORAGE_KEY));
      if (saved) {
        soundEnabled = saved.enabled !== false;
        soundVolume = Number.isFinite(saved.volume) ? Math.min(1, Math.max(0, saved.volume)) : 0.55;
      }
    } catch {}
    if ($("sound-enabled")) $("sound-enabled").checked = soundEnabled;
    if ($("sound-volume")) $("sound-volume").value = String(soundVolume);
  }
  function saveSoundSettings() {
    localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify({ enabled: soundEnabled, volume: soundVolume }));
  }
  function getAudioContext() {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioContext = new AudioCtor();
    }
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }
  function tone(frequency, start, duration, volume, type = "sine") {
    const ctx = getAudioContext();
    if (!ctx || !soundEnabled) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * soundVolume), ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(ctx.currentTime + start);
    oscillator.stop(ctx.currentTime + start + duration + 0.02);
  }
  function playSound(kind) {
    if (!soundEnabled) return;
    if (kind === "work") {
      tone(659.25, 0, 0.22, 0.7);
      tone(783.99, 0.2, 0.28, 0.65);
    } else if (kind === "break") {
      tone(783.99, 0, 0.18, 0.65);
      tone(659.25, 0.18, 0.18, 0.55);
      tone(523.25, 0.36, 0.3, 0.5);
    } else if (kind === "longBreak") {
      tone(659.25, 0, 0.2, 0.65);
      tone(783.99, 0.22, 0.2, 0.65);
      tone(987.77, 0.44, 0.28, 0.6);
    } else if (kind === "complete") {
      tone(523.25, 0, 0.22, 0.55);
      tone(659.25, 0.25, 0.22, 0.55);
      tone(783.99, 0.5, 0.22, 0.6);
      tone(1046.5, 0.75, 0.45, 0.65);
    }
  }
  function soundForStage(stage) {
    return stage?.writing ? "work" : stage?.name === "Long Break" ? "longBreak" : "break";
  }
  function reset() {
    state.running = false; state.stageIndex = 0; state.remaining = stages[0].minutes * 60;
    state.lastTick = null; state.lastTimeLabel = null; render(); announce("Timer reset. Writing ready.");
  }
  function selectPreset(key) {
    if (!PRESETS[key] || key === presetKey) return;
    presetKey = key; savePreset(); buildStages(); reset(); announce(PRESETS[key].name + " selected.");
  }
  function advance() {
    if (state.stageIndex >= stages.length - 1) {
      state.running = false; state.remaining = 0; state.lastTick = null; state.lastTimeLabel = null; render(); playSound("complete"); announce("Pomodoro session complete."); return;
    }
    state.stageIndex += 1; state.remaining = stages[state.stageIndex].minutes * 60; state.lastTick = null; state.lastTimeLabel = null;
    render(); playSound(soundForStage(stages[state.stageIndex])); announce(stages[state.stageIndex].writing ? "Writing sprint starting." : "Writing sprint ended. " + stages[state.stageIndex].name + " started.");
  }
  function tick(now) {
    if (!state.running) return;
    if (state.lastTick === null) state.lastTick = now;
    state.remaining -= (now - state.lastTick) / 1000; state.lastTick = now;
    if (state.remaining <= 0) advance();
    render(); if (state.running) requestAnimationFrame(tick);
  }
  function start() {
    if (state.running || !stages.length) return;
    getAudioContext();
    state.running = true; state.lastTick = null; playSound(soundForStage(stages[state.stageIndex])); announce("Timer started. " + stages[state.stageIndex].name + "."); requestAnimationFrame(tick);
  }
  function pause() { state.running = false; state.lastTick = null; render(); announce("Timer paused."); }
  function restart() { state.remaining = stages[state.stageIndex].minutes * 60; state.lastTick = null; state.lastTimeLabel = null; render(); announce(stages[state.stageIndex].name + " restarted."); }
  function render() {
    const stage = stages[state.stageIndex], totalSeconds = stages.reduce((sum, item) => sum + item.minutes * 60, 0);
    const completedSeconds = stages.slice(0, state.stageIndex).reduce((sum, item) => sum + item.minutes * 60, 0) + (stage ? stage.minutes * 60 - state.remaining : 0);
    const percent = totalSeconds ? Math.min(100, (completedSeconds / totalSeconds) * 100) : 0, next = stages[state.stageIndex + 1];
    $("preset-name").textContent = PRESETS[presetKey].name; $("stage-name").textContent = stage ? stage.name : "Finished"; $("time").textContent = formatTime(state.remaining);
    const label = screenTime(state.remaining) + " remaining";
    if (label !== state.lastTimeLabel) { $("time").setAttribute("aria-label", label); state.lastTimeLabel = label; }
    $("progress-percent").textContent = Math.round(percent) + "%"; $("progress").style.width = percent + "%"; $("progress").parentElement.setAttribute("aria-valuenow", Math.round(percent));
    const workRounds = stages.filter(item => item.writing).length, currentRound = stage?.round || PRESETS[presetKey].rounds;
    $("round-count").textContent = "Round " + currentRound + " of " + workRounds; $("next-stage").textContent = next ? "Next: " + next.name + " — " + formatTime(next.minutes * 60) : "All done!";
  }
  function setupUsageLinks() {
    const base = new URL(location.href); base.search = ""; base.hash = "";
    const directUrl = base.href;
    const embedUrl = new URL(directUrl); embedUrl.search = "?embed";
    const viewerUrl = new URL(directUrl); viewerUrl.search = "?viewer&theme=" + encodeURIComponent(getThemePreset());
    $("direct-url").textContent = directUrl;
    if ($("embed-url")) $("embed-url").textContent = embedUrl.href;
    $("viewer-url").textContent = viewerUrl.href;
    document.querySelectorAll(".copy-url").forEach(button => {
      if (button.dataset.copyReady === "true") return;
      button.dataset.copyReady = "true";
      button.addEventListener("click", async () => {
      const source = $(button.dataset.url).textContent;
      try { await navigator.clipboard.writeText(source); const original = button.textContent; button.textContent = "Copied!"; announce("URL copied."); setTimeout(() => { button.textContent = original; }, 1200); }
      catch { button.textContent = "Copy failed"; announce("Copy failed."); setTimeout(() => { button.textContent = "Copy"; }, 1500); }
      });
    });
  }
  $("preset").value = presetKey; loadPreset(); $("preset").value = presetKey; buildStages(); loadSoundSettings(); reset();
  $("preset").addEventListener("change", event => selectPreset(event.target.value));
  if ($("sound-enabled")) $("sound-enabled").addEventListener("change", event => { soundEnabled = event.target.checked; saveSoundSettings(); if (soundEnabled) { getAudioContext(); playSound("work"); } });
  if ($("sound-volume")) $("sound-volume").addEventListener("input", event => { soundVolume = Number(event.target.value); saveSoundSettings(); });
  if ($("sound-test")) $("sound-test").addEventListener("click", () => { getAudioContext(); playSound("break"); announce("Sound test played."); });
  $("start").addEventListener("click", start); $("pause").addEventListener("click", pause); $("restart").addEventListener("click", restart); $("skip").addEventListener("click", advance); $("reset").addEventListener("click", reset);
  if (viewerMode) $("preset").closest(".preset-picker").style.display = "none";
  else {
    setupUsageLinks();
    window.addEventListener("tlc-theme-changed", setupUsageLinks);
  }
  document.addEventListener("keydown", event => {
    if (viewerMode || event.target.matches("input, textarea, select, button, summary")) return;
    if (event.key === " ") { event.preventDefault(); state.running ? pause() : start(); }
    else if (event.key.toLowerCase() === "r") { event.preventDefault(); restart(); }
    else if (event.key.toLowerCase() === "s") { event.preventDefault(); advance(); }
  });
  window.TLC_PUBLIC_TIMER_THEME = getThemePreset();
})();