const path = require('path')
const { app, BrowserWindow, session } = require('electron')
const { startServer } = require('./electron-server')

let server;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadURL('http://localhost:3001')
  mainWindow.webContents.openDevTools()

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Access-Control-Allow-Origin'] = '*';
    callback({ requestHeaders: details.requestHeaders });
  });
}

app.whenReady().then(() => {
  server = startServer();
  
  setTimeout(createWindow, 1000);
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
})