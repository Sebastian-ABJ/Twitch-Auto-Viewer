const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', async () => {
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var token = await ipcRenderer.invoke('requesting-token')
    var validationTime = await ipcRenderer.invoke('requesting-validationTime')
    var speed = await ipcRenderer.invoke('requesting-speed')

    var logBox = document.getElementById("log-box")
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    replaceText('status', 
      "[ Monitoring " + streamer + " on a " + speed + " interval. ]")

    d = new Date()
    logBox.value += d.toLocaleTimeString() + ": Successfully validated token: " + token
    logBox.value += "\n" + d.toLocaleTimeString() + ": Token validated at: " + 
      validationTime.toLocaleDateString() + " " + validationTime.toLocaleTimeString()
  })