const fs = require('fs')
function init() {
  if (!fs.existsSync("./settings.json")) {
    console.log("No settings found, initializing to defaults...")
    settingsJSON = {
      "streamer": "None",
      "interval": "10",
      "token":"",
      "clientID": "9lyexvrvkjfh2mnygtma57mr7fp5a6"
    }
    fs.writeFileSync('./settings.json', JSON.stringify(settingsJSON, null, 4))
  }
}

function getStreamer() {
  var settingsJSON = require ('./settings.json')
  console.log("Retrieved streamer: " + settingsJSON.streamer)
  return settingsJSON.streamer
}

function getInterval() {
  var settingsJSON = require ('./settings.json')
  console.log("Retrieved interval")
  return settingsJSON.interval
}

function getToken() {
  var settingsJSON = require ('./settings.json')
  console.log("Retrieved token")
  return settingsJSON.token
}

function getClientID() {
  var settingsJSON = require ('./settings.json')
  console.log("Retrieved client ID")
  return settingsJSON.clientID
}

function getSettings() {
  return settingsJSON = require ('./settings.json')
}

function update() {
  var settingsJSON = require ('./settings.json')
  var streamerInput = document.getElementById("streamer-variable");
  var intervalInput = document.getElementById("interval-variable");
  settingsJSON.streamer = streamerInput.value
  settingsJSON.interval = intervalInput.value
  console.log(settingsJSON.token)
  fs.writeFileSync('./settings.json', JSON.stringify(settingsJSON, null, 4))
  console.log("updated settings")
}

function updateToken(token) {
  var settingsJSON = require ('./settings.json')
  settingsJSON.token = token
  fs.writeFileSync('./settings.json', JSON.stringify(settingsJSON, null, 4))
  console.log("Updated token")
}



module.exports = {init, getStreamer, getInterval, getToken, getClientID, update, updateToken, getSettings};