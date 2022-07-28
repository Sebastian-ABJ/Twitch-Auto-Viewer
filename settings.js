const electron = require('electron')
const fs = require('fs')
const path = require('path')
const userDataPath = (electron.app || electron.remote.app).getPath('userData') + "/settings.json";
console.log(userDataPath)

function init() {
  if (!fs.existsSync(userDataPath)) {
    console.log("No settings found, initializing to defaults...")
    settingsJSON = {
      "streamer": "None",
      "speed": "ASAP",
      "speedVal": "1",
      "token":"",
      "validation_time": "",
      "display_ID": "",
      "client_ID": "9lyexvrvkjfh2mnygtma57mr7fp5a6"
    }
    fs.writeFileSync(userDataPath, JSON.stringify(settingsJSON, null, 4))
  }
}

function getSettings() {
  return settingsJSON = require (userDataPath)
}

function update(streamer, speed, speedVal, displayID) {
  var settingsJSON = require (userDataPath)
  settingsJSON.streamer = streamer
  settingsJSON.speed = speed
  settingsJSON.speedVal = speedVal
  settingsJSON.display_ID = displayID
  fs.writeFileSync(userDataPath, JSON.stringify(settingsJSON, null, 4))
  console.log("Settings updated.")
}

function updateToken(token) {
  var settingsJSON = require (userDataPath)
  settingsJSON.token = token
  fs.writeFileSync(userDataPath, JSON.stringify(settingsJSON, null, 4))
  console.log("Updated token.")
}

function updateValidationTime(validationTime) {
  var settingsJSON = require (userDataPath)
  settingsJSON.validation_time = validationTime
  fs.writeFileSync(userDataPath, JSON.stringify(settingsJSON, null, 4))
  console.log("Updated token validation time.")
}

module.exports = {init, update, getSettings, updateToken, updateValidationTime};