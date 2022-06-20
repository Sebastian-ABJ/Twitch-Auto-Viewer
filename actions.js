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
    var token = await ipcRenderer.invoke('requesting-token')
    const client_id = await ipcRenderer.invoke('requesting-clientID')
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var validationTime = await ipcRenderer.invoke('requesting-validationTime')
    var interval = parseInt(await ipcRenderer.invoke('requesting-interval'))

    checkStreamButton.disabled = true
    stopButton.disabled = false

    updateLog("Monitoring Twitch for livestream...")

    while(streamFound == false && loopCancel == false) {
        if(tokenExceedsValidationTime(validationTime)) {
            console.log("Token exceeds validation time.")
            if(await ipcRenderer.invoke('validate-token')) {
                console.log("Token valid, requesting new time.")
                validationTime = await ipcRenderer.invoke('requesting-validationTime')
            } else {
                ipcRenderer.send('requesting-new-token')
                pauseApp()
                break
            }
        }
        streamFound = await twitch.checkStream(token, client_id, streamer)
        if(streamFound) {
            updateLog("STREAMER IS LIVE! Opening stream...")
            console.log(streamFound)
            ipcRenderer.send('stream-found')
        } else {
            updateLog("Streamer not live.")
        }

        await wait(interval * 1000)
    }
}

function update() {
    var streamerElement = document.getElementById("streamer-variable")
    var intervalElement = document.getElementById("interval-variable")
    streamer = streamerElement.value
    interval = intervalElement.value
    console.log("Sending " + streamer + " to main.")
    console.log("Sending " + interval + " to main.")
    ipcRenderer.send("update-streamer-interval", streamer, interval)

    updateLog("Settings updated.")
}

function stopLoop() {
    loopCancel = true
    checkStreamButton.disabled = false
    updateLog("Halting stream monitoring.")
}

//Amazing wait function that seems to work without issue
function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, time);
    })
}

function tokenExceedsValidationTime(validationTime) {
    var d = new Date()
    if(d.getHours() > (validationTime.getHours() + 1)) {
        return true
    } else {
        return false
    }
}

function updateLog(text) {
    let logBox = document.getElementById("log-box")
    let d = new Date()
    let timestamp = d.toLocaleDateString() + " " + d.toLocaleTimeString()

    logBox.value += "\n" + timestamp + ": " + text
    logBox.scrollTop = logBox.scrollHeight              //Keeps textbox scrolled down with new entries
}

function pauseApp() {
    updateLog("App paused until new token is acquired.")
}

function releaseApp() {
    updateLog("Releasing app control.")
}

ipcRenderer.on('new-token-sent', async () => {
    token = await ipcRenderer.invoke('requesting-token')
    updateLog("New token acquired: " + token)
    releaseApp()
})