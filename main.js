const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

let mainWindow; // Keep a reference to the main window
let configWindow = null; // Keep a reference to the config window
// TODO: Define a default structure for config data, including privacy considerations for block names.
let currentConfigData = {
  // Store the current configuration
  sessionDuration: 25, // Default session duration
  breakDuration: 5, // Default break duration
  blocks: [], // Default empty blocks array
};

function createWindow() {
  mainWindow = new BrowserWindow({
    // Assign to mainWindow
    width: 800,
    height: 600,
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: path.join(__dirname, "Scripts/preload.js"), // Updated path
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "Html/index.html")); // Updated path
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
    width: 500,
    height: 400, // Adjust size as needed
    title: "세션 구성",
    parent: mainWindow, // Make it a child of the main window
    modal: true, // Make it modal (optional, blocks interaction with parent)
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: path.join(__dirname, "Scripts/preload.js"), // Updated path
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show until ready
    autoHideMenuBar: true, // Hide menu bar
  });

  configWindow.loadFile(path.join(__dirname, "Html/config.html")); // Updated path

  configWindow.once("ready-to-show", () => {
    // Send the current configuration data to the config window when it's ready
    // TODO: Ensure data sent is sanitized if it contains sensitive information.
    configWindow.webContents.send("initial-config-data", currentConfigData);
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
    // TODO: Implement robust validation chain for received data structure before updating and sending.
    currentConfigData = data; // Update the stored configuration
    console.log("Main process received and updated config:", currentConfigData); // Debug log
    if (mainWindow) {
      // TODO: Ensure data sent is sanitized if it contains sensitive information.
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
