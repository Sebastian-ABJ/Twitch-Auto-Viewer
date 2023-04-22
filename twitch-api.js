//  Could probably be inside actions file but I'm lazy and this works

const fetch = require('node-fetch')

async function checkStream(token, clientID, streamer) {
    let isLive = false
    let api = "https://api.twitch.tv/helix/streams?user_login=" + streamer
    await fetch(
        api,
        {
            "headers": {
                "Authorization": "Bearer " + token,
                "Client-Id": clientID
            }
        })
    .then(response => response.json())
    .then(async response => {
        if(response.data.length == 0) {
            isLive = false
        } else if(response.data[0].type == "live") {
            isLive = true
        }
    })
    .catch(error => {
        console.log(error)
    })
    return isLive
}

async function getProfilePictures(token, clientID, streamer) {
    let api = "https://api.twitch.tv/helix/users?login=" + streamer
    let responseData = {
        "onlinePFP": "",
        "offlinePFP": ""
    }
    await fetch(
        api,
        {
            "headers": {
                "Authorization": "Bearer " + token,
                "Client-Id": clientID
            }
        })
    .then(response => response.json())
    .then(async response => {
        console.log(response)
        responseData.onlinePFP = response.data[0].profile_image_url;
        responseData.offlinePFP = response.data[0].offline_image_url
    })
    return responseData;
}

module.exports = {checkStream, getProfilePictures}