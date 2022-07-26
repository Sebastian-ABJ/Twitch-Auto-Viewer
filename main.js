const { app, BrowserWindow, screen, ipcMain } = require('electron')
const verifyToken = require('./verify-token')
const settings = require('./settings.js')
const path = require('path')
var token
var validationTime
var streamer
var speed
var displayID
var clientID

if (require('electron-squirrel-startup')) return app.quit();

app.whenReady().then(async() => {
    settings.init()

    var retrievedSettings = settings.getSettings()
    token = retrievedSettings.token
    streamer = retrievedSettings.streamer
    speed = retrievedSettings.speed
    speedVal = retrievedSettings.speedVal
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
  targetDisplay = getTargetDisplay()
  const url = "https://www.twitch.tv/" + streamer
  console.log(url)
  
  const twitchWin = new BrowserWindow({
    width: 1280,
    height: 720,
    show:false,
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
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

function createBroadcastsWindow() {
  targetDisplay = getTargetDisplay()
  const url = "https://www.twitch.tv/" + streamer + "/videos?filter=archives&sort=time"
  console.log(url)
  
  const broadcastsWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show:false,
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    fullscreen: true,
    webPreferences: {
      nodeIntegration:true,
      contextIsolation: false
    }
  })
  broadcastsWindow.loadURL(url)
  broadcastsWindow.once('ready-to-show', () => {
    broadcastsWindow.show()
    broadcastsWindow.webContents.setZoomFactor(2.4)
  })
}

function getTargetDisplay() {
  const displays = screen.getAllDisplays()

  for(var i = 0; i < displays.length; i++) {
    if (displayID == displays[i].id) {
      return displays[i];
    }
  }

  var defaultDisplay = screen.getPrimaryDisplay()
  displayID = defaultDisplay.id
  return defaultDisplay
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
    height: 400,
    resizable: false,
    webPreferences: {  
      nodeIntegration:true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'appPreload.js')
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

  ipcMain.on("open-settings", () => {
    let [appX, appY] = appWin.getPosition()
    settingsWin = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
        preload: path.join(__dirname, 'settingsPreload.js')
      },
      width: 720,
      height: 200,
      x: appX + 40,
      y: appY + 50,
      parent: appWin,
      modal: true,
    })
    //settingsWin.webContents.openDevTools()
    settingsWin.removeMenu()
    settingsWin.loadFile('settings.html')

    ipcMain.on('update-streamer-speedVal-display', (event, newStreamer, newSpeed, newSpeedVal, newDisplay) => {
      if(streamer != newStreamer) {
        console.log("Changed streamer from " + streamer + " to " + newStreamer)
        streamer = newStreamer
      }
      if(speedVal != newSpeedVal) {
        console.log("Changing speed from " + speed + " to " + newSpeed)
        console.log("Changing speed value from " + speedVal + " to " + newSpeedVal)
        speed = newSpeed
        speedVal = newSpeedVal
      }
      if(displayID != newDisplay) {
        console.log("Changing display from " + displayID + " to " + newDisplay)
        displayID = newDisplay
      }
      console.log("Updating saved settings.")
      settings.update(streamer, speed, speedVal, displayID)

      appWin.webContents.send('updated-settings', streamer, speed)

      settingsWin.close()
    })
  })

}

ipcMain.on('stream-found', () => {
  console.log("Stream detected! Opening...")
  twitchWindow()
})

ipcMain.on('open-broadcasts', () => {
  if(streamer != "") {
    console.log("Opening past broadcasts...")
    createBroadcastsWindow()
  }
})

ipcMain.handle('requesting-streamer', async () => {
  console.log("Sending " + streamer + " to renderer.")
  return streamer
})

ipcMain.handle("requesting-speed", async () => {
  console.log("Sending " + speed + " to renderer.")
  return speed
})

ipcMain.handle('requesting-speedVal', async () => {
  console.log("Sending " + speedVal + " to renderer.")
  return speedVal
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

ipcMain.handle('requesting-displays', async() => {
  console.log("Sending displays to renderer")
  var displays = screen.getAllDisplays()
  console.log(displays)
  return displays
})

ipcMain.handle('requesting-primary-display', async() => {
  console.log("Sending displays to renderer")
  var display = screen.getPrimaryDisplay()
  console.log(display)
  return display.id
})

ipcMain.on('update-token', (event, newToken) => {
  console.log("Aquired new token: " + newToken)
  token = newToken
  validationTime = new Date()
})