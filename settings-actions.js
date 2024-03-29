//  Handles updating the settings
//  Pretty sure this needs to be a separate file but I forget why

const { ipcRenderer } = require('electron');
const Renderer = require('electron/renderer');

let updateButton = document.getElementById("update-button");
let cancelButton = document.getElementById("cancel-button");
let disconnectButton = document.getElementById("disconnect-button");
let zoomSlider = document.getElementById("zoom-slider");
let zoomLabel = document.getElementById("zoom-label");
let archiveDropdown = document.getElementById("site-dropdown");
updateButton.addEventListener("click", updateSettings);


function updateSettings() {
    var streamerElement = document.getElementById("streamer-variable")
    var displayDropdown = document.getElementById("displays-dropdown")
    var betterTTVCheckbox = document.getElementById("betterttv-checkbox")
    var zoom = zoomSlider.value
    var displayID = displayDropdown.value
    var betterTTV = betterTTVCheckbox.checked.toString()
    var archive = archiveDropdown.value
    streamer = streamerElement.value
    if(streamer == "") {
        streamer = "nobody";
    }
    ipcRenderer.send("update-streamer-zoom-display", streamer, zoom, displayID, betterTTV, archive)
}

disconnectButton.onclick = async () => {
    let token = await ipcRenderer.invoke('requesting-token')
    if(token == "") {
        ipcRenderer.send("requesting-new-token");
        disconnectButton.innerText = "Disconnect";
    } else {
        disconnectButton.innerText = "Sign In";
        ipcRenderer.send("disconnect-account");
    }
}

cancelButton.onclick = () => {
    ipcRenderer.send("close-window");
}

// Refreshes label as slider moves
zoomSlider.oninput = function() {
    let value = parseFloat(this.value).toFixed(1);
    zoomLabel.innerText = "Zoom Factor: " + value + "x";
}