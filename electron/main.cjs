const { app, BrowserWindow, Menu } = require("electron");
const path = require("node:path");

function createWindow() {
  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0f0f23",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: { contextIsolation: true, sandbox: true },
  });

  // The app is fully local, so it never opens another page.
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());

  window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

Menu.setApplicationMenu(null);

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
