const TLC_EMBED = (() => {
  const params = new URLSearchParams(location.search);
  const viewer = params.has("viewer");
  const embed = params.has("embed");
  const THEME_PRESETS = {
    tlc: { bg:"#17131a", panel:"#241d29", panelHover:"#2d2433", text:"#f7f1f5", muted:"#c6b8c5", accent:"#d7a9c9", accentStrong:"#efc8df", track:"#3a2e3d" },
    neutral: { bg:"#f2f2f0", panel:"#ffffff", panelHover:"#e7e7e4", text:"#202020", muted:"#5f5f5b", accent:"#555555", accentStrong:"#303030", track:"#d0d0cc" },
    light: { bg:"#f7f1df", panel:"#fffdf6", panelHover:"#eee5cd", text:"#2d2921", muted:"#6d6659", accent:"#9a7a45", accentStrong:"#765b2f", track:"#d8ccb0" },
    dark: { bg:"#0b121c", panel:"#162333", panelHover:"#203247", text:"#f2f7fc", muted:"#b5c2cf", accent:"#82b6e8", accentStrong:"#b4d5f4", track:"#30465c" },
    "warm-neutral": { bg:"#eee7de", panel:"#fbf7f1", panelHover:"#e5dcd1", text:"#302b27", muted:"#6d6259", accent:"#8a674d", accentStrong:"#694a35", track:"#d3c6b9" },
    "cool-neutral": { bg:"#e9edef", panel:"#fafcfd", panelHover:"#dde3e7", text:"#263039", muted:"#5f6b74", accent:"#536878", accentStrong:"#394b59", track:"#c8d0d5" },
    "soft-gray": { bg:"#e5e6e8", panel:"#f6f6f7", panelHover:"#dcdde0", text:"#25262a", muted:"#62646a", accent:"#686b73", accentStrong:"#4b4e55", track:"#c6c7ca" },
    "ink-paper": { bg:"#e5dccb", panel:"#f8f2e7", panelHover:"#dcd0bd", text:"#1f1c18", muted:"#5e564c", accent:"#6a6258", accentStrong:"#423c35", track:"#c7b9a5" },
    monochrome: { bg:"#171717", panel:"#252525", panelHover:"#333333", text:"#f5f5f5", muted:"#c2c2c2", accent:"#d0d0d0", accentStrong:"#ffffff", track:"#4a4a4a" },
    contrast: { bg:"#000000", panel:"#111111", panelHover:"#222222", text:"#ffffff", muted:"#e8e8e8", accent:"#ffff00", accentStrong:"#ffff00", track:"#666666" }
  };

  function currentTheme() {
    try {
      const saved = JSON.parse(localStorage.getItem("tlc-storyworks-theme"));
      const preset = saved && typeof saved.preset === "string" ? saved.preset : "";
      return THEME_PRESETS[preset] ? preset : "tlc";
    } catch { return "tlc"; }
  }

  function applyViewerTheme() {
    if (!viewer) return;
    const requested = params.get("theme");
    const preset = THEME_PRESETS[requested] ? requested : "tlc";
    const theme = THEME_PRESETS[preset];
    const root = document.documentElement;
    root.style.setProperty("--theme-bg", theme.bg);
    root.style.setProperty("--theme-panel", theme.panel);
    root.style.setProperty("--theme-panel-hover", theme.panelHover);
    root.style.setProperty("--theme-text", theme.text);
    root.style.setProperty("--theme-muted", theme.muted);
    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-accent-strong", theme.accentStrong);
    root.style.setProperty("--theme-track", theme.track);
    document.body.dataset.theme = preset;
  }

  function applyMode() {
    if (viewer) document.body.classList.add("viewer");
    if (embed) document.body.classList.add("embed");
    applyViewerTheme();
  }

  function url(mode = "") {
    const result = new URL(location.href);
    result.search = "";
    result.hash = "";
    if (mode === "viewer") {
      result.search = "?viewer&theme=" + encodeURIComponent(currentTheme());
    } else if (mode === "embed") {
      result.search = "?embed";
    }
    return result.href;
  }

  function refreshViewerLinks() {
    const viewerUrl = url("viewer");
    document.querySelectorAll("#viewer-url").forEach(node => { node.textContent = viewerUrl; });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      try {
        if (document.execCommand("copy")) resolve();
        else reject(new Error("Copy command failed."));
      } catch (error) {
        reject(error);
      } finally {
        textarea.remove();
      }
    });
  }

  function setupCopyButtons() {
    document.querySelectorAll(".copy-url").forEach(button => {
      if (button.dataset.copyReady === "true") return;
      button.dataset.copyReady = "true";
      button.addEventListener("click", async () => {
        const source = document.getElementById(button.dataset.url);
        if (!source) return;
        const text = source.textContent.trim();
        const original = button.textContent;
        try {
          await copyText(text);
          button.textContent = "Copied!";
          const status = document.getElementById("timer-status");
          if (status) {
            status.textContent = "";
            requestAnimationFrame(() => { status.textContent = "URL copied."; });
          }
        } catch {
          button.textContent = "Copy failed";
          const status = document.getElementById("timer-status");
          if (status) {
            status.textContent = "";
            requestAnimationFrame(() => { status.textContent = "Copy failed."; });
          }
        }
        setTimeout(() => { button.textContent = original; }, 1500);
      });
    });
  }

  function scheduleLinkRefresh() {
    setTimeout(() => { applyViewerTheme(); refreshViewerLinks(); setupCopyButtons(); }, 0);
    window.addEventListener("tlc-theme-changed", () => { applyViewerTheme(); refreshViewerLinks(); setupCopyButtons(); });
  }

  applyMode();
  scheduleLinkRefresh();

  return {
    viewer,
    embed,
    isDisplayMode: viewer || embed,
    applyMode,
    url,
    currentTheme
  };
})();
