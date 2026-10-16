const { app, BrowserWindow, ipcMain, clipboard, screen } = require("electron");
const path = require("path");
const os = require("os");
const pty = require("node-pty");

let mainWindow = null;
let ptyProcess = null;
const shell = process.env.SHELL || "/bin/bash";

function spawnPty(cols, rows) {
  ptyProcess = pty.spawn(shell, ["--rcfile", path.join(__dirname, "..", "sakura.bashrc")], {
    name: "xterm-256color", cols: cols || 120, rows: rows || 34,
    cwd: os.homedir(), env: Object.assign({}, process.env, { TERM: "xterm-256color" })
  });
  ptyProcess.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("pty:data", data);
  });
  ptyProcess.onExit(({ exitCode }) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("pty:exit", exitCode);
  });
}

ipcMain.handle("pty:create", (_e, { cols, rows }) => { spawnPty(cols, rows); return { shell }; });
ipcMain.on("pty:input", (_e, data) => { if (ptyProcess) ptyProcess.write(data); });
ipcMain.on("pty:resize", (_e, { cols, rows }) => { if (ptyProcess) ptyProcess.resize(cols, rows); });
ipcMain.on("clipboard:write", (_e, text) => { clipboard.writeText(String(text)); });
ipcMain.handle("clipboard:read", () => clipboard.readText());
ipcMain.on("open-ai-window", (_e, url) => {
  const aiWin = new BrowserWindow({ width: 1100, height: 950, title: "Sakura AI - DeepSeek", backgroundColor: "#12101a" });
  aiWin.loadURL(url);
});

app.whenReady().then(() => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.workArea;
  mainWindow = new BrowserWindow({
    x: x, y: y, width: width, height: height,
    title: "Sakura", frame: true, backgroundColor: "#12101a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: false, webviewTag: true
    }
  });
  mainWindow.setBounds({ x, y, width, height });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
