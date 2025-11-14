const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setAlwaysOnTop: (state) => ipcRenderer.send("setAlwaysOnTop", state)
});