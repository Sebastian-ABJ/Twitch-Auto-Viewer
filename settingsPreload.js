const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', async () => {
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var betterTTV = await ipcRenderer.invoke('requesting-betterTTV')

    var zoom = await ipcRenderer.invoke('requesting-zoom')
    zoom = parseFloat(zoom).toFixed(1)

    var zoomSlider = document.getElementById('zoom-slider')
    var displayDropdown = document.getElementById('displays-dropdown')
    var betterTTVCheckBox = document.getElementById('betterttv-checkbox')
    var displays = await ipcRenderer.invoke('requesting-displays')
    var displayID = await ipcRenderer.invoke('requesting-selected-display')

    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    if(streamer == "Nobody") {
      replaceText('streamer-variable', '')
    } else {
      replaceText('streamer-variable', streamer)
    }

    if(betterTTV == "false") {
      betterTTVCheckBox.checked = false
    }

    displays.forEach(addDisplays)
    
    function addDisplays(display) {
      var option = document.createElement("option");
      var scaling = display.scaleFactor
      var width = display.size.width * scaling
      var height = display.size.height * scaling

      option.text = width + " x " + height
      option.value = display.id
      displayDropdown.add(option)
    }

    for(var i = 0; i < displayDropdown.length; i++) {
      if (displayID == displayDropdown[i].value) {
        displayDropdown[i].selected = true;
        break;
      }
    }

    replaceText('zoom-label', "Zoom Factor: " + zoom + "x")
    zoomSlider.value=zoom;
})

  