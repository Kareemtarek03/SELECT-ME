const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods for auto-update communication
contextBridge.exposeInMainWorld("electronAPI", {
  // Listen for update status from main process
  onUpdateStatus: (callback) => {
    ipcRenderer.on("update-status", (event, data) => callback(data));
  },
  // Remove update status listener
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners("update-status");
  },
  // Request app restart to install update
  restartApp: () => {
    ipcRenderer.send("restart-app");
  },
  // Get current update status on demand
  getUpdateStatus: () => {
    return ipcRenderer.invoke("get-update-status");
  },
});
