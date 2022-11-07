const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', async () => {
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var speedVal = await ipcRenderer.invoke('requesting-speedVal')
    var speed = await ipcRenderer.invoke('requesting-speed')
    var betterTTV = await ipcRenderer.invoke('requesting-betterTTV')
    var speedDropDown = document.getElementById('speed-dropdown')
    var displayDropdown = document.getElementById('displays-dropdown')
    var betterTTVCheckBox = document.getElementById('betterttv-checkbox')
    var displays = await ipcRenderer.invoke('requesting-displays')
    var displayID = await ipcRenderer.invoke('requesting-selected-display')

    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    replaceText('streamer-variable', streamer)

    if(betterTTV == "false") {
      betterTTVCheckBox.checked = false
    }
    
    speedDropDown.value=speedVal

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
        return;
      }
    }
})

  