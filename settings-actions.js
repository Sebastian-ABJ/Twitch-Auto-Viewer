const { ipcRenderer } = require('electron')

let updateButton = document.getElementById("update-button");
updateButton.addEventListener("click", update);

function update() {
    var streamerElement = document.getElementById("streamer-variable")
    var speedDropDown = document.getElementById("speed-dropdown")
    var speedVal = speedDropDown.options[speedDropDown.selectedIndex].value
    var speed = speedDropDown.options[speedDropDown.selectedIndex].innerText
    console.log(speedVal)
    streamer = streamerElement.value
    console.log("Sending " + streamer + " to main.")
    console.log("Sending " + speedVal + " to main.")
    ipcRenderer.send("update-streamer-speedVal", streamer, speed, speedVal)
}