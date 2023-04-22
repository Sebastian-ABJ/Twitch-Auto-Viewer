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

let statusText = document.getElementById("status")

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
    checkStreamButton.style.backgroundColor = "rgb(55, 50, 97)"

    ipcRenderer.send('start-monitoring');                           //Enables powersave blocker

    if(await ipcRenderer.invoke('validate-token')) {
        console.log("Token valid, requesting new time...")
        validationTime = await ipcRenderer.invoke('requesting-validationTime')
        updateLog("Updated token validation time.")
    } else {
        updateLog("Token invalid, requesting new token...")
        ipcRenderer.send('requesting-new-token')
        return
    }

    updateLog("Monitoring Twitch for livestream...")
    while(loopCancel == false) {
        if(tokenExceedsValidationTime(validationTime)) {
            console.log("Token exceeds validation time.")
            updateLog("Validating token...")
            if(await ipcRenderer.invoke('validate-token')) {
                console.log("Token valid, requesting new time.")
                validationTime = await ipcRenderer.invoke('requesting-validationTime')
                updateLog("Token validated successfully.")
                updateLog("Updated token validation time.");
            } else {
                updateLog("Token invalid, requesting new token...")
                ipcRenderer.send('requesting-new-token')
                break
            }
        }
        streamFound = await twitch.checkStream(token, client_id, streamer)
        if(streamFound) {
            statusText.style.color = "rgb(0, 255, 0)"
            statusText.innerText = streamer + " is live!"
            if(broadcastsOpen) {
                broadcastToggle()
            } 
            if(await isStreamOpen() == false) {
                updateLog("STREAMER IS LIVE!")
                updateLog("Opening livestream...")
                ipcRenderer.send('open-stream')
                statusText.innerText = streamer + " is live!"
                statusText.style.color = "rgb(0, 255, 0)"
            }
        } else {
            if(await isStreamOpen() == true) {
                ipcRenderer.send("streamer-offline");
            }
            statusText.innerText = streamer + " is offline";
            toggleStatusTextColor();
        }
        await wait(500) //in milliseconds
    }
    statusText.style.color = "white";
    updateLog("Monitoring stopped.")
    statusText.innerText = "Monitoring " + streamer;
    ipcRenderer.send('stop-monitoring');
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
        checkStreamButton.innerText = "Start"
        checkStreamButton.style.background = "rgb(82, 72, 168)"
        checkStreamButton.onmouseover = () => {
            checkStreamButton.backgroundColor = "rgb(71, 63, 146)";
        }
    }
}

function broadcastToggle() {
    if (!broadcastsOpen) {
        broadcastsOpen = true;
        ipcRenderer.send('open-broadcasts')
        updateLog("Opening previous broadcasts...")
        broadcastsButton.innerText = "Close Past Broadcasts"
    } else {
        broadcastsOpen = false;
        ipcRenderer.send('close-broadcast-window')
        broadcastsButton.innerText = "Open Past Broadcasts"
    }
}

async function isStreamOpen() {
    return await ipcRenderer.invoke('is-stream-open')
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
    var now = new Date()
    if(now.getTime() - validationTime.getTime() >= 3600000) {
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

function toggleStatusTextColor() {
    if(statusText.style.color == "rgb(255, 0, 0)") {
        statusText.style.color = "rgb(148, 18, 18)"
    } else {
        statusText.style.color = "rgb(255, 0, 0)"
    }
}

//  Begin communication channels to main process
ipcRenderer.on('new-token-sent', async () => {              //  Retrieves updated token should validation fail
    token = await ipcRenderer.invoke('requesting-token')
    updateLog("New token acquired.")
})

ipcRenderer.on('updated-settings', (event, streamer, speed) => {       //   Updates status text when new settings are applied
    statusText.innerText = "Monitoring " + streamer
    updateLog("Settings updated.")
})

ipcRenderer.on('broadcasts-closed', async () => {
    broadcastsOpen = false;
    updateLog("Closing broadcast window...")
    broadcastsButton.innerText = "Open Past Broadcasts"
})

ipcRenderer.on('window-closed', () => {
    stopLoop();
})

ipcRenderer.on('new-profile-picture', async () => {
    let streamerPFPElement = document.getElementById("streamer-pfp")
    let newPFP = await ipcRenderer.invoke('requesting-online-pfp')
    streamerPFPElement.src = newPFP
})