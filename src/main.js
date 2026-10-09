const { app, BrowserWindow, ipcMain, clipboard, screen } = require("electron");
const path = require("path");
const os = require("os");
const pty = require("node-pty");

let mainWindow = null;
let ptyProcess = null;
const shell = process.env.SHELL || "/bin/bash";

function spawnPty(cols, rows) {
  ptyProcess = pty.spawn(
    shell,
    ["--rcfile", path.join(__dirname, "..", "sakura.bashrc")],
    {
      name: "xterm-256color",
      cols: cols || 120,
      rows: rows || 34,
      cwd: os.homedir(),
      env: Object.assign({}, process.env, { TERM: "xterm-256color" }),
    },
  );

  ptyProcess.onData((data) => {
    const filtered = data
      .replace(/failed to connect socket.*\.ydotool_socket.*\n?/g, "")
      .replace(/Please check if ydotoold is running\.\n?/g, "");

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("pty:data", filtered);
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("pty:exit", exitCode);
    }
  });
}

ipcMain.handle("pty:create", (_e, { cols, rows }) => {
  spawnPty(cols, rows);
  return { shell };
});

ipcMain.on("pty:input", (_e, data) => {
  if (ptyProcess) ptyProcess.write(data);
});

ipcMain.on("pty:resize", (_e, { cols, rows }) => {
  if (ptyProcess) ptyProcess.resize(cols, rows);
});

ipcMain.on("clipboard:write", (_e, text) => {
  clipboard.writeText(String(text));
});

ipcMain.handle("clipboard:read", () => {
  return clipboard.readText();
});

app.whenReady().then(() => {
  // Get primary display's WORK AREA (excludes taskbar/panels)
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.workArea;

  mainWindow = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    title: "Sakura",
    frame: true, // Keep title bar for window controls
    backgroundColor: "#12101a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
    },
  });

  // Force window to show at calculated bounds
  mainWindow.setBounds({ x, y, width, height });

  // Alternative: Use maximize() if you prefer it to fill the work area
  // mainWindow.maximize();

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Optional: Request "skip taskbar" or "dock above" hints for GNOME
  // mainWindow.setSkipTaskbar(false);  // Show in taskbar
  // mainWindow.setVisibleOnAllWorkspaces(true);  // Show on all workspaces (optional)
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
