// Envoltorio de escritorio con Electron (para Steam / ejecutable de Windows).
// Levanta el servidor estático en un puerto libre y abre el juego en una ventana.
//   npm install            (descarga Electron, una sola vez)
//   npm run desktop        (abre el juego como aplicación)
//   npm run build:win      (genera el instalador/ejecutable en dist/)
const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const { start } = require(path.join(__dirname, '..', 'server.js'));

let win;

function createWindow(port) {
  win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 960, minHeight: 540,
    backgroundColor: '#0b0e17',
    title: 'Element Survival',
    autoHideMenuBar: true,
    fullscreen: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.setMenuBarVisibility(false);
  win.loadURL(`http://127.0.0.1:${port}/`);
  globalShortcut.register('F11', () => win.setFullScreen(!win.isFullScreen()));
  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  start(0, (port) => createWindow(port));
});

app.on('window-all-closed', () => app.quit());
