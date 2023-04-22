const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', async () => {
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var token = await ipcRenderer.invoke('requesting-token')
    const client_id = await ipcRenderer.invoke('requesting-clientID')
    var validationTime = await ipcRenderer.invoke('requesting-validationTime')

    var streamerPFP = document.getElementById('streamer-pfp')

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
        "Monitoring " + streamer);
      let profileImage = await ipcRenderer.invoke('requesting-online-pfp');
      streamerPFP.src = profileImage;
    }



    d = new Date()
    logBox.value += d.toLocaleDateString() + " " + d.toLocaleTimeString() + ": Successfully validated token."
      validationTime.toLocaleDateString() + " " + validationTime.toLocaleTimeString()
  })