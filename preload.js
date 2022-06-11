const fs = require('fs')
const { ipcRenderer } = require('electron')
const { stringify } = require('querystring')
var settings = require('./settings')
var interval = settings.getInterval()

window.addEventListener('DOMContentLoaded', async () => {
  var streamer = await ipcRenderer.invoke('requesting-streamer')
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