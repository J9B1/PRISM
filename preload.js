const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setAlwaysOnTop: (state) => ipcRenderer.send("setAlwaysOnTop", state),

    onUpdateStatus: (callback) =>
        ipcRenderer.on("update-status", (event, msg) => {
            window.postMessage({ prismUpdateStatus: msg });
        })
});
