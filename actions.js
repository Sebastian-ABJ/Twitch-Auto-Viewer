const twitch = require('./twitch-api')
const { ipcRenderer } = require('electron')

var loopCancel = true

let updateButton = document.getElementById("settings-button");
updateButton.addEventListener("click", openSettings);

let checkStreamButton = document.getElementById("check-stream-button")
checkStreamButton.addEventListener("click", actionHandler)

let broadcastsButton = document.getElementById("broadcasts-button")
broadcastsButton.addEventListener("click", openBroadcasts)

function actionHandler() {
    if(loopCancel) {
        streamLoop()
    } else {
        stopLoop()
    }
}

async function streamLoop() {
    loopCancel = false
    streamFound = false
    var token = await ipcRenderer.invoke('requesting-token')
    const client_id = await ipcRenderer.invoke('requesting-clientID')
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var validationTime = await ipcRenderer.invoke('requesting-validationTime')
    var speedVal = parseInt(await ipcRenderer.invoke('requesting-speedVal'))
    checkStreamButton.disabled = false
    checkStreamButton.innerText="Stop"

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

        var time
        if(speedVal == "1") {
            time = 100
        } else if(speedVal == "2") {
            time = 5000
        } else if(speedVal == "3") {
            time = 54000
        } else if(speedVal == "4") {
            time = 270000
        }
        await wait(time)
    }
    updateLog("Monitoring stopped.")
}

function openSettings() {
    if(loopCancel == false) {
        stopLoop()
    }
    updateLog('Opening settings...')
    ipcRenderer.send('open-settings')
}

function stopLoop() {
    if (loopCancel == false) {
        loopCancel = true
        checkStreamButton.innerText = "Go!"
        updateLog("Halting stream monitoring...")
    }
}

function openBroadcasts() {
    stopLoop()
    ipcRenderer.send('open-broadcasts')

}

/* Amazing wait function that seems to work without issue
function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, time);
    })
}
*/
async function wait(time) {
    await delay()

    if(time <= 0 || loopCancel == true) {       //Pipe helps prevent responsiveness delay
        return
    } else {
       await wait(time - 100)
    }
}

function delay() {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, 100);
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

ipcRenderer.on('updated-settings', (event, streamer, speed) => {
    statusElement = document.getElementById('status')
    statusText = statusElement.innerText = 
        "Monitoring " + streamer + " on a " + speed + " interval."
    updateLog("Settings updated.")
})