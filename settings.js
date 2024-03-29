//  All things having to do with the settings file of the app

const electron = require('electron')
const fs = require('fs')
const userDataPath = (electron.app || electron.remote.app).getPath('userData') + "/settings.json";
console.log(userDataPath)

function init() {
  if (!fs.existsSync(userDataPath)) {
    console.log("No settings found, initializing to defaults...")
    settingsJSON = {
      "streamer": "Nobody",
      "offline_pfp": "",
      "online_pfp": "",
      "zoom": "1.0",
      "token":"",
      "validation_time": "",
      "display_ID": "",
      "client_ID": "9lyexvrvkjfh2mnygtma57mr7fp5a6",                      //  Static variable set by Twitch
      "betterttv_enabled": "true",
      "archive": "Twitch"
    }
    fs.writeFileSync(userDataPath, JSON.stringify(settingsJSON, null, 4))
  }
}

function getSettings() {
  return settingsJSON = require (userDataPath)
}

function update(streamer, offlinePFP, onlinePFP, zoom, displayID, betterttv, archive) {
  var settingsJSON = require (userDataPath)
  settingsJSON.streamer = streamer
  settingsJSON.offline_pfp = offlinePFP;
  settingsJSON.online_pfp = onlinePFP;
  settingsJSON.zoom = zoom
  settingsJSON.display_ID = displayID
  settingsJSON.betterttv_enabled = betterttv
  settingsJSON.archive = archive
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