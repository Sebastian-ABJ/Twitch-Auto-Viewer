const { app, BrowserWindow, screen, ipcMain } = require('electron')
const verifyToken = require('./verify-token')
const settings = require('./settings.js')
const path = require('path')
var token
var validationTime
var streamer
var interval
var clientID

app.whenReady().then(async() => {
    settings.init()

    var retrievedSettings = settings.getSettings()
    token = retrievedSettings.token
    streamer = retrievedSettings.streamer
    interval = retrievedSettings.interval
    clientID = retrievedSettings.client_ID

    await verifyToken(token)
    .then(async response => {
        if (response.returnVal == 401) {
          createAuthWindow()
        } else {
          validationTime = response.validationTime
          console.log("Token validated at: " + validationTime)
          settings.updateValidationTime(validationTime)
          createAppWindow()
        }
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
  
  const twitchWin = new BrowserWindow({
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
  twitchWin.loadURL(url)
  //twitchWin.webContents.openDevTools();
  twitchWin.once('ready-to-show', () => {
    twitchWin.show()
    twitchWin.webContents.setZoomFactor(2.4)
    twitchWin.webContents.on('did-finish-load', () => {
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
                      twitchWin.webContents.executeJavaScript(code)
      })
  })
}

function createAuthWindow(preload) {
  console.log("Generating new security token...")
  authWin = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  authWin.loadURL("https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=9lyexvrvkjfh2mnygtma57mr7fp5a6&redirect_uri=http://localhost/callback");

  const {session: {webRequest}} = authWin.webContents;

  const filter = {
    urls: [
      'http://localhost/callback'
    ]
  };

  webRequest.onBeforeRequest(filter, async ({url}) => {
      hashStart = url.indexOf("=")
      hashEnd = url.indexOf("&")
      token = url.substring(hashStart + 1, hashEnd)

      settings.updateToken(token)
      validationTime = new Date()
      settings.updateValidationTime(validationTime)

      createAppWindow()
        
      return authWin.close()
  });

  authWin.on('authenticated', () => {
    if (!authWin) return;
    authWin.close();
    authWin = null;
  });

  authWin.on('closed', () => {
    authWin = null;
  });
}

function createAppWindow() {
  const appWin = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: {  
      nodeIntegration:true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show:false
  })
  appWin.loadFile('index.html')
  //appWin.webContents.openDevTools();
  appWin.once('ready-to-show', () => {
    appWin.show()
  }) 

  ipcMain.on('requesting-new-token', () => {
    console.log("Generating new security token...")
    authWin = new BrowserWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }
    });

    authWin.loadURL("https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=9lyexvrvkjfh2mnygtma57mr7fp5a6&redirect_uri=http://localhost/callback");

    const {session: {webRequest}} = authWin.webContents;

    const filter = {
      urls: [
        'http://localhost/callback'
      ]
    };

    webRequest.onBeforeRequest(filter, async ({url}) => {
        hashStart = url.indexOf("=")
        hashEnd = url.indexOf("&")
        token = url.substring(hashStart + 1, hashEnd)
        
        settings.updateToken(token)
        validationTime = new Date()
        settings.updateValidationTime(validationTime)

        appWin.webContents.send('new-token-sent')

        authWin.close()
    })
  })
}

ipcMain.on('stream-found', () => {
  console.log("Stream detected! Opening...")
  twitchWindow()
})

ipcMain.handle('requesting-streamer', async () => {
  console.log("Sending " + streamer + " to renderer.")
  return streamer
})

ipcMain.handle('requesting-interval', async () => {
  console.log("Sending " + interval + " to renderer.")
  return interval
})

ipcMain.handle('requesting-token', async() => {
  console.log("Sending token " + token + " to renderer.")
  return token
})

ipcMain.handle('validate-token', async () => {
  console.log("Validating token")
  var returnVal

  await verifyToken(token)
  .then(async response => {
    if (response.returnVal == 401) {
      returnVal = false
    } else {
      validationTime = response.validationTime
      console.log("Token validated at: " + validationTime)
      settings.updateValidationTime(validationTime)
      returnVal = true
    }
  })
  return returnVal
})

ipcMain.handle('requesting-validationTime', async () => {
  console.log("Sending " + validationTime + " to renderer.")
  return validationTime
})

ipcMain.handle('requesting-clientID', async() => {
  console.log("Sending " + clientID + " to renderer.")
  return clientID
})

ipcMain.on('update-streamer-interval', (event, newStreamer, newInterval) => {
  if(streamer != newStreamer) {
    console.log("Changed streamer from " + streamer + " to " + newStreamer)
    streamer = newStreamer
  }
  if(interval != newInterval) {
    console.log("Changing interval from " + interval + " to " + newInterval)
    interval = newInterval
  }
  console.log("Updating saved settings.")
  settings.update(streamer, interval)
})

ipcMain.on('update-token', (event, newToken) => {
  console.log("Aquired new token: " + newToken)
  token = newToken
  validationTime = new Date()
})