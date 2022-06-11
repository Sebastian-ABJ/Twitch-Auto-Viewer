const { BrowserWindow } = require('electron')
const path = require('path')

const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration:true,
        contextIsolation: false,
        enableRemoteModule: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show:false
    })
    win.loadFile('index.html')
    win.webContents.openDevTools();
    win.once('ready-to-show', () => {
        win.show()
    })
  }
module.exports = createWindow;