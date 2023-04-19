//  Could probably be inside actions file but I'm lazy and this works

const fetch = require('node-fetch')

async function checkStream(token, clientID, streamer) {
    isLive = false
    api = "https://api.twitch.tv/helix/streams?user_login=" + streamer
    console.log("Checking " + api)
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

async function getProfilePicture(token, clientID, streamer) {
    
}

module.exports = {checkStream}