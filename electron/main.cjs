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
      preload: path.join(__dirname, '../electron/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  mainWindow.webContents.openDevTools()

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Access-Control-Allow-Origin'] = '*';
    callback({ requestHeaders: details.requestHeaders });
  });
}

app.whenReady().then(() => {
  //server = startServer();  
  //setTimeout(createWindow, 1000);
}).then(createWindow)

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