const { BrowserWindow, screen, ipcRenderer } = require('electron')
const settings = require('./settings.js')


const twitchWindow = () => {
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
module.exports = twitchWindow;