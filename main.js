const { app, BrowserWindow, screen } = require('electron')
const createAppWindow = require('./app-process')
const verifyToken = require('./verify-token')
const settings = require('./settings.js')
const { ipcMain } = require('electron')
var token
var validationTime
var streamer
var interval


app.whenReady().then(async() => {
    settings.init()

    var retrievedSettings = settings.getSettings()
    token = retrievedSettings.token
    streamer = retrievedSettings.streamer
    interval = retrievedSettings.interval


    await verifyToken(token)
    .then(async response => {
        if (response.returnVal == 401) {
          createAuthWindow()
        }

      
    })
    .then( () => {
      console.log("All settings good - starting app...")
      createAppWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

function twitchWindow() {
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find(
  display => display.bounds.x !== 0 || display.bounds.y !== 0)
  const url = "https://www.twitch.tv/" + streamer
  console.log(url)
  
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show:false,
    x: externalDisplay.bounds.x,
    y: externalDisplay.bounds.y,
    fullscreen: true,
    webPreferences: {
      nodeIntegration:true,
      contextIsolation: false
    }
  })
  win.loadURL(url)
  //win.webContents.openDevTools();
  win.once('ready-to-show', () => {
      win.show()
      win.webContents.on('did-finish-load', () => {
          let code = `
                      var streamButtons = document.getElementsByClassName('ScCoreButton-sc-1qn4ixc-0 cgCHoV ScButtonIcon-sc-o7ndmn-0 kwoFXD')
                      console.log(streamButtons)
                      for(button of streamButtons) {
                          if(button.dataset.aTarget = "player-theatre-mode-button") {
                              window.dispatchEvent(new KeyboardEvent('keydown', {
                                  key: "t",
                                  keyCode: 116,
                                  altKey: true,
                                }))
                          } else if (button.ariaLabel = "Expand Chat") {
                              console.log(button)
                              button.click()
                          }
                      }
                      `
          win.webContents.executeJavaScript(code)
      })
  })
}

function createAuthWindow() {
  console.log("Generating new security token...")
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  win.loadURL("https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=9lyexvrvkjfh2mnygtma57mr7fp5a6&redirect_uri=http://localhost/callback");

  const {session: {webRequest}} = win.webContents;

  const filter = {
    urls: [
      'http://localhost/callback'
    ]
  };

  webRequest.onBeforeRequest(filter, async ({url}) => {
      hashStart = url.indexOf("=")
      hashEnd = url.indexOf("&")
      token = url.substring(hashStart + 1, hashEnd)
      validationTime = new Date()
      return win.close()
  });

  win.on('authenticated', () => {
    if (!win) return;
    win.close();
    win = null;
  });

  win.on('closed', () => {
    win = null;
  });
}

ipcMain.on('stream-found', () => {
  console.log("Stream detected! Opening...")
  twitchWindow()
})

ipcMain.handle('requesting-streamer', async (event) => {
  console.log("Sending " + streamer + " to renderer.")
  return streamer
})

ipcMain.handle('requesting-token', async() => {
  console.log("Sending token " + token + " to renderer.")
  return token
})

ipcMain.handle('requesting-validationTime', async () => {
  console.log("Sening " + validationTime + " to renderer.")
  return validationTime
})

ipcMain.on('update-streamer', (event, newStreamer) => {
  console.log("Changed streamer from " + streamer + " to " + newStreamer)
  streamer = newStreamer
})

ipcMain.on('update-token', (event, newToken) => {
  console.log("Aquired new token: " + newToken)
  token = newToken
  validationTime = new Date()
})