const { app, BrowserWindow, screen, ipc, ipcMain, powerSaveBlocker, session, dialog, ipcRenderer } = require('electron')
const verifyToken = require('./verify-token')
const settings = require('./settings.js')
const path = require('path')
var token
var validationTime
var streamer
var zoom
var displayID
var clientID

var appWin = null

if (require('electron-squirrel-startup')) app.quit();    //  Prevents startup before installation on Windows

/*  Windows installation logic recommended by Electron devs  */
//--------------------------------------------------------------------------------------------------------------//
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};
//--------------------------------------------------------------------------------------------------------------//

//  Wrapper logic to prevent multiple instances from running
const instanceLock = app.requestSingleInstanceLock()
    
if (!instanceLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (appWin) {
      if (appWin.isMinimized()) appWin.restore()
      appWin.focus()
    }
  })

  app.whenReady().then(async() => {  
    settings.init()                                 //  Gets relevant settings or creates default ones if none exist
    var retrievedSettings = settings.getSettings()  

    token = retrievedSettings.token
    streamer = retrievedSettings.streamer
    zoom = retrievedSettings.zoom
    clientID = retrievedSettings.client_ID
    displayID = retrievedSettings.display_ID
    betterTTV = retrievedSettings.betterttv_enabled

    if(betterTTV == "true") {
      await session.defaultSession.loadExtension(
        path.join(__dirname, 'ext/ajopnjidmegmdimjlfnijceegpefgped/7.4.40_0')
      )
    }


    await verifyToken(token)          //  Gets access token and validates it. Authenticates user to create new one if none exist
    .then(async response => {         //  Starts up app when valid token is retrieved
        if (response.returnVal == 401) {
          createAuthWindow()
        } else {
          validationTime = response.validationTime
          console.log("Token validated at: " + validationTime)
          settings.updateValidationTime(validationTime)
          createAppWindow()                             //  If token is valid, the invalid token branch will open via the AuthWindow
        }
    })
  })
}

//  Keeps app from lingering on MacOS when all windows are closed
app.on('window-all-closed', () => {               
    app.quit()
})

function createAppWindow() {
  appWin = new BrowserWindow({
    width: 800,
    height: 450,
    resizable: false,
    webPreferences: {  
      nodeIntegration:true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'appPreload.js')
    },
    show:false
  })
  appWin.removeMenu();
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
      frame: false,
      width: 720,
      height: 255,
      resizable: false,
      x: appX + 40,
      y: appY + 120,
      parent: appWin,
      modal: true,
    })
    //settingsWin.webContents.openDevTools()
    settingsWin.loadFile('settings.html')

    ipcMain.once('update-streamer-zoom-display', (event, newStreamer, newZoom, newDisplay, newBetterTTV) => {
      if(streamer != newStreamer) {
        console.log("Changed streamer from " + streamer + " to " + newStreamer)
        streamer = newStreamer
      }
      if(zoom != newZoom) {
        console.log("Changing zoom factor from " + zoom + " to " + newZoom)
        zoom = newZoom
      }
      if(displayID != newDisplay) {
        console.log("Changing display from " + displayID + " to " + newDisplay)
        displayID = newDisplay
      }
      if(betterTTV != newBetterTTV) {
        let messageStr = "Restart required to change BetterTTV integration!"
        let typeStr = "warning"

        dialog.showMessageBoxSync(settingsWin, { 
          message: messageStr,
          type: typeStr
        })
        console.log("Changing BetterTTV integration from '" + betterTTV + "' to '" + newBetterTTV + "'")
        betterTTV = newBetterTTV
      }
      console.log("Updating saved settings...")
      settings.update(streamer, zoom, displayID, betterTTV)

      appWin.webContents.send('updated-settings', streamer, zoom)

      settingsWin.close()
    })

    ipcMain.once('close-window', () => {
      ipcMain.removeAllListeners('update-streamer-zoom-display', () => {});
      settingsWin.close();
    }) 
  })
}

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
  twitchWin.webContents.openDevTools();
  twitchWin.once('ready-to-show', () => {
    twitchWin.show()
    twitchWin.webContents.setZoomFactor(parseFloat(zoom))
    twitchWin.webContents.on('did-finish-load', () => {     //  Ensures chat is open --functional--, attempts to theatre-mode stream --nonfunctional--
      let code = `
        var buttons = document.getElementsByTagName('button')
        for(button of buttons) {
          if (button.ariaLabel === "Expand Chat") {
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
  var psb_ID = powerSaveBlocker.start('prevent-display-sleep')
  console.log(psb_ID)
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
    broadcastsWindow.webContents.setZoomFactor(parseFloat(zoom))
  })

  ipcMain.once('close-broadcast-window', () => {
      broadcastsWindow.close()
  })

  broadcastsWindow.once('close', () => {
    appWin.webContents.send('broadcasts-closed')
    powerSaveBlocker.stop(psb_ID)
  })
}

function createAuthWindow(preload) {        //  Largely taken from Oauth2.0 docs, slightly modified for simplicity, admittedly less secure
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

      createAppWindow()                             //  Secondary App window start because browser windows are asynchronous.
                                                    //  I don't know how to wait for the authentication to finish so I branched the App start
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

/*  Helper functions and other logic  */
//--------------------------------------------------------------------------------------------------------------//

function getTargetDisplay() {             //  Ensures the preferred display is available, otherwise returns the main display
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

//  Begin various communication channels between main program and browser windows. Mostly accessing and editing global variables
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

ipcMain.handle("requesting-zoom", async () => {
  console.log("Sending " + zoom + " to renderer.")
  return zoom
})

ipcMain.handle('requesting-selected-display', async () => {
  console.log("Sending selected display " + displayID + " to renderer.")
  return displayID
})

ipcMain.handle('requesting-betterTTV', async () => {
  console.log("Sending BetterTTV preference of '" + betterTTV + "' to renderer.")
  return betterTTV
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