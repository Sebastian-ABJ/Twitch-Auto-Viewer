const twitch = require('./twitch-api')
const { ipcRenderer } = require('electron')

var loopCancel = true

var broadcastsOpen = false

let updateButton = document.getElementById("settings-button");
updateButton.addEventListener("click", openSettings);

let checkStreamButton = document.getElementById("check-stream-button")
checkStreamButton.addEventListener("click", actionHandler)

let broadcastsButton = document.getElementById("broadcasts-button")
broadcastsButton.addEventListener("click", broadcastToggle)

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
    checkStreamButton.disabled = false
    checkStreamButton.innerText="Stop"

    updateLog("Monitoring Twitch for livestream...")

    while(streamFound == false && loopCancel == false) {
        if(tokenExceedsValidationTime(validationTime)) {
            console.log("Token exceeds validation time.")
            updateLog("Time since last token validation longer than an hour.")
            updateLog("Validating token...")
            if(await ipcRenderer.invoke('validate-token')) {
                console.log("Token valid, requesting new time.")
                validationTime = await ipcRenderer.invoke('requesting-validationTime')
                updateLog("Token validated successfully.")
            } else {
                updateLog("Token invalid, requesting new token...")
                ipcRenderer.send('requesting-new-token')
                pauseApp()
                break
            }
        }
        streamFound = await twitch.checkStream(token, client_id, streamer)
        if(streamFound) {
            updateLog("STREAMER IS LIVE!")
            if(broadcastsOpen) {
                broadcastToggle()
            }
            console.log(streamFound)
            updateLog("Opening livestream...")
            stopLoop()
            ipcRenderer.send('stream-found')
        } else {
            updateLog("Streamer offline.")
        }

        await wait(5000) //in milliseconds
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

function broadcastToggle() {
    if (!broadcastsOpen) {
        broadcastsOpen = true;
        stopLoop()
        ipcRenderer.send('open-broadcasts')
        updateLog("Opening previous broadcasts...")
        broadcastsButton.innerText = "Close Past Broadcasts"
    } else {
        broadcastsOpen = false;
        ipcRenderer.send('close-broadcast-window')
        updateLog("Closing broadcast window...")
        broadcastsButton.innerText = "Open Past Broadcasts"
    }
}

async function wait(time) {
    await delay()

    if(time <= 0 || loopCancel == true) {       //  Pipe helps prevent responsiveness delay
        return
    } else {
       await wait(time - 100)                   //  Breaks up wait function up in 1/10 sec intervals to prevent unwanted API call in between actual intervals
    }
}

/* Amazing wait function that seems to work without issue
function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, time);
    })
}
*/

function delay() {                              //  Modified wait function from above
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, 100);
    })
}

function tokenExceedsValidationTime(validationTime) {       //  Adheres to Twitch's hourly token validation policy
    var d = new Date()
    if(d.getHours() > (validationTime.getHours())) {
        return true
    } else {
        return false
    }
}

function updateLog(text) {                          //  Boy do I love application logs
    let logBox = document.getElementById("log-box")
    let d = new Date()
    let timestamp = d.toLocaleDateString() + " " + d.toLocaleTimeString()

    logBox.value += "\n" + timestamp + ": " + text

    logBox.scrollTop = logBox.scrollHeight              //  Keeps textbox scrolled down with new entries
}

function pauseApp() {
    //TODO: Prevent app from being used when authentication window is open
    updateLog("App paused until new token is acquired.")
}

function releaseApp() {
    //TODO: Prevent app from being used when authentication window is open
    updateLog("Releasing app control.")
}

//  Begin communication channels to main process
ipcRenderer.on('new-token-sent', async () => {              //  Retrieves updated token should validation fail
    token = await ipcRenderer.invoke('requesting-token')
    updateLog("New token acquired: " + token)
    releaseApp()
})

ipcRenderer.on('updated-settings', (event, streamer, speed) => {       //   Updates status text when new settings are applied
    statusElement = document.getElementById('status')
    statusText = statusElement.innerText = "Monitoring " + streamer
    updateLog("Settings updated.")
})

ipcRenderer.on('broadcasts-closed', async () => {
    broadcastsOpen = false;
    updateLog("Closing broadcast window...")
    broadcastsButton.innerText = "Open Past Broadcasts"
})
