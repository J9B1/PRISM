const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setAlwaysOnTop: (state) => ipcRenderer.send("setAlwaysOnTop", state),

    onUpdateStatus: (callback) =>
        ipcRenderer.on("update-status", (event, msg) => {
            callback(msg);
        }),

    closeApp: () => ipcRenderer.send("closeApp")
});
