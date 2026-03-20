const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any IPC methods you need here
  // For example:
  // invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  // on: (channel, func) => ipcRenderer.on(channel, func),
  // removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})

console.log('Preload script loaded successfully')
