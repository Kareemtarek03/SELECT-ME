const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods for auto-update communication
contextBridge.exposeInMainWorld("electronAPI", {
  // Listen for update status from main process
  onUpdateStatus: (callback) => {
    ipcRenderer.on("update-status", (event, data) => callback(data));
  },
  // Request app restart to install update
  restartApp: () => {
    ipcRenderer.send("restart-app");
  },
});
