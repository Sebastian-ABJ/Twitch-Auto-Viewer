const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', async () => {
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var interval = await ipcRenderer.invoke('requesting-interval')
    var token = await ipcRenderer.invoke('requesting-token')
    var validationTime = await ipcRenderer.invoke('requesting-validationTime')

    var logBox = document.getElementById("log-box")
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    replaceText('streamer-variable', streamer)
    replaceText('interval-variable', interval)

    d = new Date()
    logBox.value += d.toLocaleTimeString() + ": Successfully validated token: " + token
    logBox.value += "\n" + d.toLocaleTimeString() + ": Token validated at: " + 
      validationTime.toLocaleDateString() + " " + validationTime.toLocaleTimeString()
  })