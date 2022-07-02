const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', async () => {
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var speedVal = await ipcRenderer.invoke('requesting-speedVal')
    var speed = await ipcRenderer.invoke('requesting-speed')
    var speedDropDown = document.getElementById('speed-dropdown')

    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    replaceText('streamer-variable', streamer)
    speedDropDown.value=speedVal
  })