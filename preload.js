const { contextBridge, ipcRenderer } = require("electron");

// 초기에는 노출할 API가 없을 수 있습니다.
// 필요에 따라 여기에 API를 정의합니다. 예:
// contextBridge.exposeInMainWorld('electronAPI', {
//   sendNotification: (message) => ipcRenderer.send('notify', message)
// });

console.log("Preload script loaded.");
