const fs = require('fs')
const { ipcRenderer } = require('electron')
const { stringify } = require('querystring')

window.addEventListener('DOMContentLoaded', async () => {
  var streamer = await ipcRenderer.invoke('requesting-streamer')
  var interval = await ipcRenderer.invoke('requesting-interval')
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }

  replaceText('streamer-variable', streamer)
  replaceText('interval-variable', interval)

  })