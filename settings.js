const fs = require('fs')

function init() {
  if (!fs.existsSync("./settings.json")) {
    console.log("No settings found, initializing to defaults...")
    settingsJSON = {
      "streamer": "None",
      "speed": "ASAP",
      "speedVal": "1",
      "token":"",
      "validation_time": "",
      "client_ID": "9lyexvrvkjfh2mnygtma57mr7fp5a6"
    }
    fs.writeFileSync('./settings.json', JSON.stringify(settingsJSON, null, 4))
  }
}

function getSettings() {
  return settingsJSON = require ('./settings.json')
}

function update(streamer, speed, speedVal) {
  var settingsJSON = require ('./settings.json')
  settingsJSON.streamer = streamer
  settingsJSON.speed = speed
  settingsJSON.speedVal = speedVal
  fs.writeFileSync('./settings.json', JSON.stringify(settingsJSON, null, 4))
  console.log("Settings updated.")
}

function updateToken(token) {
  var settingsJSON = require ('./settings.json')
  settingsJSON.token = token
  fs.writeFileSync('./settings.json', JSON.stringify(settingsJSON, null, 4))
  console.log("Updated token.")
}

function updateValidationTime(validationTime) {
  var settingsJSON = require ('./settings.json')
  settingsJSON.validation_time = validationTime
  fs.writeFileSync('./settings.json', JSON.stringify(settingsJSON, null, 4))
  console.log("Updated token validation time.")
}

module.exports = {init, update, getSettings, updateToken, updateValidationTime};