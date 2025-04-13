const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Main window -> Main process: Request to open config window
  openConfigWindow: () => ipcRenderer.send("open-config-window"),

  // Main window <- Main process: Receive saved config data
  onConfigData: (callback) =>
    ipcRenderer.on("config-data", (_event, value) => callback(value)),

  // Config window -> Main process: Send config data to save
  sendConfigData: (data) => ipcRenderer.send("save-config-data", data),

  // Config window -> Main process: Request to close itself
  closeConfigWindow: () => ipcRenderer.send("close-config-window"),
});
