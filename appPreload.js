const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', async () => {
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var token = await ipcRenderer.invoke('requesting-token')
    var validationTime = await ipcRenderer.invoke('requesting-validationTime')

    var logBox = document.getElementById("log-box")
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    if(streamer == "Nobody") {
      replaceText('status',
      "Open the settings to choose a Twitch channel to monitor.")
    } else {
      replaceText('status', 
        "Monitoring " + streamer)
    }

    d = new Date()
    logBox.value += d.toLocaleDateString() + " " + d.toLocaleTimeString() + ": Successfully validated token."
      validationTime.toLocaleDateString() + " " + validationTime.toLocaleTimeString()
  })