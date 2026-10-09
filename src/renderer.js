function fail(msg) {
  let el = document.getElementById("boot-error");
  if (!el) {
    el = document.createElement("div");
    el.id = "boot-error";
    el.style.cssText =
      'position:absolute;top:40px;left:8px;right:8px;color:#ff6680;font:13px "DejaVu Sans Mono",monospace;z-index:9999;white-space:pre-wrap;background:#1a0d12;padding:8px;border-radius:6px;';
    document.body.appendChild(el);
  }
  el.textContent += "ERROR: " + msg + "\n";
}
window.addEventListener("error", (e) =>
  fail(e.message + " [" + (e.filename || "?") + ":" + (e.lineno || "?") + "]"),
);

const TerminalCtor = window.Terminal;
const FitAddonCtor = window.FitAddon ? window.FitAddon.FitAddon : null;

if (typeof TerminalCtor !== "function") fail("xterm.js did NOT load");
else if (typeof FitAddonCtor !== "function") fail("addon-fit did NOT load");
else if (typeof window.sakura === "undefined") fail("preload bridge missing");
else initApp();

function initApp() {
  const term = new TerminalCtor({
    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    fontSize: 14,
    cursorBlink: true,
    scrollback: 5000,
    allowTransparency: true,
    theme: {
      background: "rgba(18, 16, 26, 0)",
      foreground: "#d4d4d4",
      cursor: "#e679ee",
      selectionBackground: "rgba(255, 255, 255, 0.3)",
      black: "#000000",
      red: "#f44747",
      green: "#6a9955",
      yellow: "#d7ba7d",
      blue: "#569cd6",
      magenta: "#e679ee",
      cyan: "#4ec9b0",
      white: "#d4d4d4",
      brightBlack: "#808080",
      brightRed: "#f14c4c",
      brightGreen: "#89d185",
      brightYellow: "#dcdcaa",
      brightBlue: "#9cdcfe",
      brightMagenta: "#f2a3ff",
      brightCyan: "#75d7c0",
      brightWhite: "#ffffff",
    },
  });

  const fitAddon = new FitAddonCtor();
  term.loadAddon(fitAddon);
  const container = document.getElementById("terminal-container");
  term.open(container);
  fitAddon.fit();
  term.write("\x1b[90m[sakura] booting shell...\x1b[0m\r\n");

  window.sakura.onData((data) => term.write(data));
  window.sakura.onExit((code) =>
    term.write("\r\n[shell exited (" + code + ")]\r\n"),
  );
  term.onData((data) => window.sakura.sendInput(data));

  function syncResize() {
    fitAddon.fit();
    window.sakura.resizePty(term.cols, term.rows);
  }
  window.sakura.createPty(term.cols, term.rows);
  window.addEventListener("resize", syncResize);

  const aiPane = document.getElementById("ai-pane");
  const toggleBtn = document.getElementById("btn-toggle-ai");

  // Toggle Lumo panel
  let toggleLocked = false;
  function doToggle() {
    if (toggleLocked) return;
    toggleLocked = true;
    setTimeout(() => (toggleLocked = false), 150);
    const wasHidden = aiPane.classList.contains("hidden");
    aiPane.classList.toggle("hidden");
    setTimeout(syncResize, 60);
    if (!wasHidden) term.focus();
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        doToggle();
      }
      if (e.key === "Escape" && !aiPane.classList.contains("hidden")) {
        e.preventDefault();
        doToggle();
      }
    },
    true,
  );
  toggleBtn.addEventListener("click", doToggle);

  // Ctrl+C copy / Ctrl+V paste (terminal only)
  window.addEventListener(
    "keydown",
    (ev) => {
      const key = ev.key.toLowerCase();
      if ((ev.ctrlKey || ev.metaKey) && key === "v") {
        ev.preventDefault();
        ev.stopPropagation();
        window.sakura.readClipboard().then((text) => {
          if (text) term.paste(text);
        });
        return;
      }
      if ((ev.ctrlKey || ev.metaKey) && key === "c" && !ev.shiftKey) {
        const sel = term.getSelection();
        if (sel) {
          ev.preventDefault();
          ev.stopPropagation();
          window.sakura.copyToClipboard(sel);
        }
      }
    },
    true,
  );

  container.addEventListener("mouseup", () => term.focus());
  term.focus();
}
