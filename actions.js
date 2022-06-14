const settings = require('./settings')
const twitch = require('./twitch-api')
const { ipcRenderer } = require('electron')

var loopCancel = false

let updateButton = document.getElementById("update-button");
updateButton.addEventListener("click", update);

let checkStreamButton = document.getElementById("check-stream-button")
checkStreamButton.addEventListener("click", streamLoop)

let stopButton = document.getElementById("stop-button")
stopButton.addEventListener("click", stopLoop)

async function streamLoop() {
    loopCancel = false
    streamFound = false
    const token = await ipcRenderer.invoke('requesting-token')
    const client_id = await ipcRenderer.invoke('requesting-clientID')
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var validationTime = await ipcRenderer.invoke('requesting-validationTime')
    var interval = parseInt(ipcRenderer.invoke('requesting-interval'))

    while(streamFound == false && loopCancel == false) {
        streamFound = await twitch.checkStream(token, client_id, streamer)
        await wait(interval * 1000)
        if(streamFound == true) {
            console.log(streamFound)
            ipcRenderer.send('stream-found')
        }
    }
}

async function update() {
    var streamerElement = document.getElementById("streamer-variable")
    var intervalElement = document.getElementById("interval-variable")
    streamer = streamerElement.value
    interval = intervalElement.value
    console.log("Sending " + streamer + " to main.")
    console.log("Sending " + interval + " to main.")
    ipcRenderer.send("update-streamer-interval", streamer, interval)
}

function stopLoop() {
    loopCancel = true
}

//Amazing wait function that seems to work without issue
function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, time);
    })
}

function checkValidation() {

}