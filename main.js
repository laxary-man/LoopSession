const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // 보안 강화
      nodeIntegration: false, // 보안 강화
    },
  });

  mainWindow.loadFile("index.html");

  // 개발자 도구 열기 (선택 사항)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // macOS에서 dock 아이콘 클릭 시 창 재생성
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  // Windows & Linux 외에는 앱 종료 방지
  if (process.platform !== "darwin") app.quit();
});
