//  Handles updating the settings
//  Pretty sure this needs to be a separate file but I forget why

const { ipcRenderer } = require('electron')

let updateButton = document.getElementById("update-button");
updateButton.addEventListener("click", update);

function update() {
    var streamerElement = document.getElementById("streamer-variable")
    var speedDropDown = document.getElementById("speed-dropdown")
    var displayDropdown = document.getElementById("displays-dropdown")
    var betterTTVCheckbox = document.getElementById("betterttv-checkbox")
    var speedVal = speedDropDown.options[speedDropDown.selectedIndex].value
    var speed = speedDropDown.options[speedDropDown.selectedIndex].innerText
    var displayID = displayDropdown.value
    var betterTTV = betterTTVCheckbox.checked.toString()
    console.log(speedVal)
    streamer = streamerElement.value
    console.log("Sending " + streamer + " to main.")
    console.log("Sending " + speedVal + " to main.")
    ipcRenderer.send("update-streamer-speedVal-display", streamer, speed, speedVal, displayID, betterTTV)
}