const settings = require('./settings')
const twitch = require('./twitch-api')
const { ipcRenderer } = require('electron')

var loopCancel = false

let updateButton = document.getElementById("update-button");
updateButton.addEventListener("click", updateTest);

let checkStreamButton = document.getElementById("check-stream-button")
checkStreamButton.addEventListener("click", streamLoop)

let stopButton = document.getElementById("stop-button")
stopButton.addEventListener("click", stopLoop)

let testButton = document.getElementById("test-button")
testButton.addEventListener("click", test)

async function streamLoop() {
    loopCancel = false
    streamFound = false
    const token = await ipcRenderer.invoke('requesting-token')
    console.log(token)
    const client_id = settings.getClientID()
    var streamerElement = document.getElementById("streamer-variable")
    var intervalElement = document.getElementById("interval-variable")
    var streamer = await ipcRenderer.invoke('requesting-streamer')
    var validationTime = await ipcRenderer.invoke('requesting-validationTime')
    var interval = parseInt(intervalElement.value)

    while(streamFound == false && loopCancel == false) {
        streamFound = await twitch.checkStream(token, client_id, streamer)
        await wait(interval * 1000)
        if(streamFound == true) {
            console.log(streamFound)
            ipcRenderer.send('stream-found')
        }
    }
}

async function test() {
    const result = await ipcRenderer.invoke('my-invokable-ipc')
    console.log(result) 
  }

async function updateTest() {
    var streamerElement = document.getElementById("streamer-variable")
    streamer = streamerElement.value
    ipcRenderer.send('update-streamer', streamer)
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