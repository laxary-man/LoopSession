const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

let mainWindow; // Keep a reference to the main window
let configWindow = null; // Keep a reference to the config window

function createWindow() {
  mainWindow = new BrowserWindow({
    // Assign to mainWindow
    width: 800,
    height: 600,
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");
  // mainWindow.webContents.openDevTools(); // Optional: Open DevTools for main window

  // Clean up config window reference if main window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
    if (configWindow) {
      configWindow.close();
    }
  });
}

// Function to create the configuration window
function createConfigWindow() {
  if (configWindow) {
    // Prevent opening multiple config windows
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    width: 400,
    height: 650, // Adjust size as needed
    title: "세션 구성",
    parent: mainWindow, // Make it a child of the main window
    modal: true, // Make it modal (optional, blocks interaction with parent)
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Reuse the same preload script
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show until ready
    autoHideMenuBar: true, // Hide menu bar
  });

  configWindow.loadFile(path.join(__dirname, "config.html")); // Load the new HTML file

  configWindow.once("ready-to-show", () => {
    configWindow.show();
    // configWindow.webContents.openDevTools(); // Optional: Open DevTools for config window
  });

  configWindow.on("closed", () => {
    configWindow = null; // Dereference the window object
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Listen for the request to open the config window
  ipcMain.on("open-config-window", createConfigWindow);

  // Listen for config data from the config window and send it to the main window
  ipcMain.on("save-config-data", (event, data) => {
    if (mainWindow) {
      // TODO: Validate received data structure before sending
      mainWindow.webContents.send("config-data", data);
    }
    // Close the config window after saving
    if (configWindow) {
      configWindow.close();
    }
  });

  // Listen for request to close the config window
  ipcMain.on("close-config-window", () => {
    if (configWindow) {
      configWindow.close();
    }
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
