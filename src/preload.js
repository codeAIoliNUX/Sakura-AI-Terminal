const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sakura", {
  createPty: (cols, rows) => ipcRenderer.invoke("pty:create", { cols, rows }),
  sendInput: (data) => ipcRenderer.send("pty:input", data),
  resizePty: (cols, rows) => ipcRenderer.send("pty:resize", { cols, rows }),
  onData: (cb) => ipcRenderer.on("pty:data", (_e, data) => cb(data)),
  onExit: (cb) => ipcRenderer.on("pty:exit", (_e, code) => cb(code)),
  copyToClipboard: (text) => ipcRenderer.send("clipboard:write", text),
  readClipboard: () => ipcRenderer.invoke("clipboard:read"),
});
