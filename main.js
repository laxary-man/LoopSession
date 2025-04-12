const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // TODO: Later use preload scripts
    },
  });

  mainWindow.loadFile("index.html");

  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Test App",
    message: "Hello World!",
    buttons: ["OK"],
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // NOTE: MacOS specific: On macOS it's common to re-create a window in the app when the
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// NOTE: App to quit when all windows are closed (except on macOS)
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

const fs = require("fs");
if (!fs.existsSync(path.join(__dirname, "preload.js"))) {
  fs.writeFileSync(path.join(__dirname, "preload.js"), "// Preload script");
}
