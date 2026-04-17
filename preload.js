const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods for auto-update communication.
// NOTE: `onUpdateStatus` returns an unsubscribe function so callers can cleanly
// detach their callback without clobbering other listeners via `removeAllListeners`.
// This avoids the listener-leak / duplicate-dispatch issue that was contributing
// to heavy re-renders (and the white-screen symptom) during downloads.
contextBridge.exposeInMainWorld("electronAPI", {
  // Listen for update status from main process. Returns an unsubscribe function.
  onUpdateStatus: (callback) => {
    const listener = (_event, data) => {
      try {
        callback(data);
      } catch (err) {
        // Never let a renderer-side callback error propagate into IPC
        console.error("[preload] onUpdateStatus callback error:", err);
      }
    };
    ipcRenderer.on("update-status", listener);
    return () => {
      ipcRenderer.removeListener("update-status", listener);
    };
  },
  // Kept for backward compatibility - removes all update-status listeners.
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
