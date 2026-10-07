(() => {
  "use strict";

  const STORAGE_KEY = window.TIMER_STORAGE_KEY || "tlc-storyworks-writing-timer";
  const CONFIG_PARAM = "config";
  const DEFAULT_CONFIG = JSON.parse(JSON.stringify(TIMER_CONFIG));
  const params = new URLSearchParams(location.search);
  const viewerMode = params.has("viewer");
  const embedMode = params.has("embed");

  if (viewerMode) document.body.classList.add("viewer");
  if (embedMode) document.body.classList.add("embed");

  const $ = id => document.getElementById(id);
  let settingsOpener = null;

  function restoreSettingsFocus() {
    if (settingsOpener && document.contains(settingsOpener)) settingsOpener.focus();
    settingsOpener = null;
  }

  function setupUsageLinks() {
    const baseUrl = new URL(location.href);
    baseUrl.search = "";
    baseUrl.hash = "";
    const directUrl = baseUrl.href;
    const sharedConfig = encodeURIComponent(JSON.stringify(config));
    const viewerUrl = new URL(directUrl);
    viewerUrl.search = "?viewer&" + CONFIG_PARAM + "=" + sharedConfig;
    const embedUrl = new URL(directUrl);
    embedUrl.search = "?embed&" + CONFIG_PARAM + "=" + sharedConfig;

    const directUrlNode = $("direct-url");
    const viewerUrlNode = $("viewer-url");
    const embedUrlNode = $("embed-url");
    const iframeCodeNode = $("iframe-code");
    if (directUrlNode) directUrlNode.textContent = directUrl;
    if (viewerUrlNode) viewerUrlNode.textContent = viewerUrl;
    if (embedUrlNode) embedUrlNode.textContent = embedUrl;
    if (iframeCodeNode) iframeCodeNode.textContent = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" title="Writing Stream Timer"></iframe>`;

    document.querySelectorAll(".copy-url").forEach(button => {
      button.addEventListener("click", async () => {
        const source = $(button.dataset.url).textContent;
        try {
          await navigator.clipboard.writeText(source);
          const original = button.textContent;
          button.textContent = "Copied!";
          announce(button.dataset.url === "iframe-code" ? "Iframe code copied." : "URL copied.");
          setTimeout(() => { button.textContent = original; }, 1200);
        } catch {
          button.textContent = "Copy failed";
          announce("Copy failed.");
          setTimeout(() => { button.textContent = button.dataset.url === "iframe-code" ? "Copy iframe" : "Copy"; }, 1500);
        }
      });
    });
  }

  function loadConfig() {
    try {
      const shared = params.get(CONFIG_PARAM);
      if (shared) {
        const parsed = JSON.parse(shared);
        if (parsed && parsed.streamName && Array.isArray(parsed.stages) && parsed.stages.length) {
          const sharedConfig = normalizeConfig(parsed);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedConfig));
          return sharedConfig;
        }
      }
    } catch (error) {
      console.warn("Could not load timer settings from the shared URL.", error);
    }

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.streamName && Array.isArray(saved.stages) && saved.stages.length) {
        // Migrate the old personal default without overwriting intentional custom names.
        if (saved.streamName === "Writing with Ceri") {
          saved.streamName = "TLC Storyworks";
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        }
        return normalizeConfig(saved);
      }
    } catch (error) {
      console.warn("Could not load saved timer settings.", error);
    }
    return normalizeConfig({
      ...TIMER_CONFIG,
      stages: TIMER_PLAN.stages
    });
  }

  function normalizeConfig(source) {
    return {
      streamName: String(source.streamName || "TLC Storyworks"),
      planName: String(source.planName || source.name || "Writing Session"),
      stages: source.stages.map(stage => ({
        name: String(stage.name || "Stage"),
        minutes: Math.max(1, Math.round(Number(stage.minutes) || 1)),
        writing: Boolean(stage.writing)
      })),
      display: {
        showWritingProgress: source.display?.showWritingProgress !== false,
        showStreamProgress: source.display?.showStreamProgress !== false,
        showNextStage: source.display?.showNextStage !== false,
        showPlanName: Boolean(source.display?.showPlanName)
      },
      labels: {
        writingIcon: source.labels?.writingIcon ?? "✍️",
        breakIcon: source.labels?.breakIcon ?? "☕",
        nextPrefix: source.labels?.nextPrefix ?? "Next",
        writingProgressLabel: source.labels?.writingProgressLabel ?? "Writing progress",
        streamProgressLabel: source.labels?.streamProgressLabel ?? "Stream progress"
      }
    };
  }

  let config = loadConfig();
  let stages = config.stages;
  let totalStreamSeconds = 0;
  let totalWritingSeconds = 0;

  const state = {
    stageIndex: 0,
    remaining: 0,
    running: false,
    lastTick: null,
    lastTimeLabel: null
  };

  function recalculateTotals() {
    totalStreamSeconds = stages.reduce((sum, stage) => sum + stage.minutes * 60, 0);
    totalWritingSeconds = stages
      .filter(stage => stage.writing)
      .reduce((sum, stage) => sum + stage.minutes * 60, 0);
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function formatTimeForScreenReader(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const parts = [];
    if (minutes) parts.push(minutes + (minutes === 1 ? " minute" : " minutes"));
    if (secs || !minutes) parts.push(secs + (secs === 1 ? " second" : " seconds"));
    return parts.join(" ");
  }

  function announce(message) {
    $("timer-status").textContent = "";
    requestAnimationFrame(() => { $("timer-status").textContent = message; });
  }

  function writingStages() {
    return stages.filter(stage => stage.writing);
  }

  function writingBlockNumber() {
    if (!stages[state.stageIndex]) return writingStages().length;
    return stages.slice(0, state.stageIndex + 1).filter(stage => stage.writing).length;
  }

  function completedWritingSeconds() {
    return stages.slice(0, state.stageIndex)
      .filter(stage => stage.writing)
      .reduce((sum, stage) => sum + stage.minutes * 60, 0)
      + (stages[state.stageIndex]?.writing
        ? stages[state.stageIndex].minutes * 60 - state.remaining
        : 0);
  }

  function completedStreamSeconds() {
    return stages.slice(0, state.stageIndex)
      .reduce((sum, stage) => sum + stage.minutes * 60, 0)
      + (stages[state.stageIndex]
        ? stages[state.stageIndex].minutes * 60 - state.remaining
        : 0);
  }

  function setProgressVisibility() {
    $("writing-progress-wrap").hidden = !config.display.showWritingProgress;
    $("stream-progress-wrap").hidden = !config.display.showStreamProgress;
    $("next-stage").hidden = !config.display.showNextStage;
    $("plan-name").hidden = !config.display.showPlanName;
  }

  function render() {
    const stage = stages[state.stageIndex];
    const writingProgress = totalWritingSeconds
      ? Math.min(100, (completedWritingSeconds() / totalWritingSeconds) * 100)
      : 0;
    const streamProgress = totalStreamSeconds
      ? Math.min(100, (completedStreamSeconds() / totalStreamSeconds) * 100)
      : 0;
    const next = stages[state.stageIndex + 1];
    const writingCount = writingStages().length;

    $("stream-name").textContent = config.streamName;
    $("plan-name").textContent = config.planName;
    const stagePrefix = stage
      ? (stage.writing ? config.labels.writingIcon : config.labels.breakIcon).trim()
      : "";
    $("stage-name").textContent = stage
      ? (stagePrefix ? stagePrefix + " " : "") + stage.name
      : "Finished";
    $("time").textContent = formatTime(state.remaining);
    const timeLabel = formatTimeForScreenReader(state.remaining) + " remaining";
    if (timeLabel !== state.lastTimeLabel) {
      $("time").setAttribute("aria-label", timeLabel);
      state.lastTimeLabel = timeLabel;
    }

    $("writing-progress-percent").textContent = Math.round(writingProgress) + "%";
    $("writing-progress").style.width = writingProgress + "%";
    $("writing-progress").parentElement.setAttribute("aria-valuenow", Math.round(writingProgress));
    $("writing-progress").parentElement.setAttribute("aria-label", config.labels.writingProgressLabel);
    $("writing-progress-label").textContent = config.labels.writingProgressLabel;
    $("block-count").textContent = writingBlockNumber() + " / " + writingCount + " writing blocks";

    $("stream-progress-percent").textContent = Math.round(streamProgress) + "%";
    $("stream-progress").style.width = streamProgress + "%";
    $("stream-progress").parentElement.setAttribute("aria-valuenow", Math.round(streamProgress));
    $("stream-progress").parentElement.setAttribute("aria-label", config.labels.streamProgressLabel);
    $("stream-progress-label").textContent = config.labels.streamProgressLabel;

    $("next-stage").textContent = next
      ? config.labels.nextPrefix + ": " + next.name + " — " + formatTime(next.minutes * 60)
      : "All done!";

    setProgressVisibility();
  }

  function tick(now) {
    if (!state.running) return;
    if (state.lastTick === null) state.lastTick = now;
    state.remaining -= (now - state.lastTick) / 1000;
    state.lastTick = now;

    if (state.remaining <= 0) advance();
    render();
    if (state.running) requestAnimationFrame(tick);
  }

  function start() {
    if (state.running || !stages.length) return;
    state.running = true;
    state.lastTick = null;
    announce("Timer started. " + (stages[state.stageIndex]?.name || "Current stage") + ".");
    requestAnimationFrame(tick);
  }

  function pause() {
    state.running = false;
    state.lastTick = null;
    render();
    announce("Timer paused.");
  }

  function restart() {
    if (!stages[state.stageIndex]) return;
    state.remaining = stages[state.stageIndex].minutes * 60;
    state.lastTick = null;
    state.lastTimeLabel = null;
    render();
    announce((stages[state.stageIndex].name || "Current stage") + " restarted.");
  }

  function reset() {
    state.running = false;
    state.stageIndex = 0;
    state.remaining = stages[0].minutes * 60;
    state.lastTick = null;
    state.lastTimeLabel = null;
    render();
    announce("Timer reset. " + (stages[0]?.name || "First stage") + " ready.");
  }

  function advance() {
    if (state.stageIndex >= stages.length - 1) {
      state.running = false;
      state.remaining = 0;
      state.lastTick = null;
      state.lastTimeLabel = null;
      announce("Timer complete.");
      return;
    }

    state.stageIndex += 1;
    state.remaining = stages[state.stageIndex].minutes * 60;
    state.lastTick = null;
    state.lastTimeLabel = null;
    announce("Stage changed to " + stages[state.stageIndex].name + ". " + formatTimeForScreenReader(state.remaining) + ".");
  }

  function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function applyConfig(nextConfig) {
    config = normalizeConfig(nextConfig);
    stages = config.stages;
    recalculateTotals();
    state.running = false;
    state.stageIndex = 0;
    state.remaining = stages[0].minutes * 60;
    state.lastTick = null;
    state.lastTimeLabel = null;
    saveConfig();
    render();
  }

  function populateSettings() {
    $("setting-stream-name").value = config.streamName;
    $("setting-plan-name").value = config.planName;
    $("setting-writing-progress").checked = config.display.showWritingProgress;
    $("setting-stream-progress").checked = config.display.showStreamProgress;
    $("setting-next-stage").checked = config.display.showNextStage;
    $("setting-plan-display").checked = config.display.showPlanName;
    $("setting-writing-icon").value = config.labels.writingIcon;
    $("setting-break-icon").value = config.labels.breakIcon;
    $("setting-next-prefix").value = config.labels.nextPrefix;
    $("setting-writing-label").value = config.labels.writingProgressLabel;
    $("setting-stream-label").value = config.labels.streamProgressLabel;
    renderStageEditors();
  }

  function renderStageEditors(focusIndex = null) {
    const list = $("stage-list");
    list.replaceChildren();

    config.stages.forEach((stage, index) => {
      const row = document.createElement("div");
      row.className = "stage-editor";

      const number = document.createElement("div");
      number.className = "stage-number";
      number.textContent = index + 1;
      number.setAttribute("aria-hidden", "true");

      const nameLabel = document.createElement("label");
      nameLabel.className = "stage-name-input";
      nameLabel.append("Name");
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.maxLength = 80;
      nameInput.value = stage.name;
      nameInput.dataset.field = "name";
      nameInput.setAttribute("aria-label", `Stage ${index + 1} name`);
      nameLabel.appendChild(nameInput);

      const minutesLabel = document.createElement("label");
      minutesLabel.className = "stage-minutes";
      minutesLabel.append("Minutes");
      const minutesInput = document.createElement("input");
      minutesInput.type = "number";
      minutesInput.min = "1";
      minutesInput.max = "1440";
      minutesInput.step = "1";
      minutesInput.value = stage.minutes;
      minutesInput.dataset.field = "minutes";
      minutesInput.setAttribute("aria-label", `Stage ${index + 1} duration in minutes`);
      minutesLabel.appendChild(minutesInput);

      const writingLabel = document.createElement("label");
      writingLabel.className = "stage-writing";
      const writingInput = document.createElement("input");
      writingInput.type = "checkbox";
      writingInput.checked = stage.writing;
      writingInput.dataset.field = "writing";
      writingInput.setAttribute("aria-label", `Stage ${index + 1} counts toward writing progress`);
      writingLabel.append(writingInput, " Writing");

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "icon-button remove-stage";
      removeButton.title = "Remove stage";
      removeButton.setAttribute(
        "aria-label",
        config.stages.length <= 1
          ? "Remove stage (at least one stage is required)"
          : `Remove stage ${index + 1}: ${stage.name || "Stage"}`
      );
      removeButton.textContent = "×";
      removeButton.disabled = config.stages.length <= 1;

      row.append(number, nameLabel, minutesLabel, writingLabel, removeButton);

      [nameInput, minutesInput, writingInput].forEach(input => {
        input.addEventListener("input", () => updateStageFromEditor(row, index));
        input.addEventListener("change", () => updateStageFromEditor(row, index));
      });

      removeButton.addEventListener("click", () => {
        if (config.stages.length <= 1) return;
        const focusTargetIndex = Math.min(index, config.stages.length - 2);
        config.stages.splice(index, 1);
        renderStageEditors(focusTargetIndex);
        announce(`Removed stage ${index + 1}. Focus moved to stage ${focusTargetIndex + 1}.`);
      });

      list.appendChild(row);
    });

    if (focusIndex !== null) {
      const target = list.querySelectorAll(".stage-editor")[focusIndex]?.querySelector('[data-field="name"]');
      target?.focus();
    }
  }

  function updateStageFromEditor(row, index) {
    const stage = config.stages[index];
    if (!stage) return;

    const nameInput = row.querySelector('[data-field="name"]');
    const minutesInput = row.querySelector('[data-field="minutes"]');
    const writingInput = row.querySelector('[data-field="writing"]');

    stage.name = nameInput.value;
    stage.minutes = Math.max(1, Math.min(1440, Math.round(Number(minutesInput.value) || 1)));
    stage.writing = writingInput.checked;
  }

  function readSettingsForm() {
    config.streamName = $("setting-stream-name").value.trim() || "TLC Storyworks";
    config.planName = $("setting-plan-name").value.trim() || "Writing Session";
    config.display = {
      showWritingProgress: $("setting-writing-progress").checked,
      showStreamProgress: $("setting-stream-progress").checked,
      showNextStage: $("setting-next-stage").checked,
      showPlanName: $("setting-plan-display").checked
    };
    config.labels = {
      writingIcon: $("setting-writing-icon").value || "✍️",
      breakIcon: $("setting-break-icon").value || "☕",
      nextPrefix: $("setting-next-prefix").value.trim() || "Next",
      writingProgressLabel: $("setting-writing-label").value.trim() || "Writing progress",
      streamProgressLabel: $("setting-stream-label").value.trim() || "Stream progress"
    };
    config.stages.forEach(stage => {
      stage.name = stage.name.trim() || "Stage";
      stage.minutes = Math.max(1, Math.round(Number(stage.minutes) || 1));
    });
    return config;
  }

  function openSettings() {
    if (viewerMode) return;
    settingsOpener = document.activeElement;
    populateSettings();
    $("settings-dialog").showModal();
    $("setting-stream-name").focus();
  }

  function closeSettings() {
    $("settings-dialog").close();
    restoreSettingsFocus();
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", event => {
      const target = event.target;
      const isTextEntry = target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      const isInteractiveControl = target instanceof HTMLButtonElement ||
        target instanceof HTMLAnchorElement ||
        target instanceof HTMLElement && target.tagName === "SUMMARY";
      if (isTextEntry || isInteractiveControl || $("settings-dialog").open || viewerMode) return;

      const key = event.key.toLowerCase();
      if (event.key === " ") {
        event.preventDefault();
        state.running ? pause() : start();
      } else if (key === "r") {
        event.preventDefault();
        restart();
      } else if (key === "s") {
        event.preventDefault();
        advance();
        render();
      }
    });
  }

  $("start").addEventListener("click", start);
  $("pause").addEventListener("click", pause);
  $("restart").addEventListener("click", restart);
  $("skip").addEventListener("click", () => { advance(); render(); });
  $("reset").addEventListener("click", reset);
  $("configure").addEventListener("click", openSettings);
  $("close-settings").addEventListener("click", closeSettings);
  $("cancel-settings").addEventListener("click", closeSettings);

  $("add-stage").addEventListener("click", () => {
    config.stages.push({
      name: "New Stage",
      minutes: 10,
      writing: false
    });
    const newStageIndex = config.stages.length - 1;
    renderStageEditors(newStageIndex);
    announce(`Added stage ${newStageIndex + 1}. Focus moved to its name field.`);
  });

  $("restore-defaults").addEventListener("click", () => {
    config = normalizeConfig({
      ...DEFAULT_CONFIG,
      stages: DEFAULT_CONFIG.plans[DEFAULT_CONFIG.activePlan]?.stages || DEFAULT_CONFIG.stages
    });
    populateSettings();
  });

  $("settings-form").addEventListener("submit", event => {
    event.preventDefault();
    applyConfig(readSettingsForm());
    closeSettings();
  });

  $("settings-dialog").addEventListener("cancel", event => {
    event.preventDefault();
    closeSettings();
  });

  $("settings-dialog").addEventListener("click", event => {
    if (event.target === $("settings-dialog")) closeSettings();
  });

  if (viewerMode) $("configure").style.display = "none";

  setupKeyboardShortcuts();

  recalculateTotals();
  state.remaining = stages[0].minutes * 60;
  if (!viewerMode && !embedMode) setupUsageLinks();
  render();
})();