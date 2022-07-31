const fetch = require('node-fetch')
var returnData
var returnVal
var validationTime
async function verifyToken(access_token) {
    await fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            "headers": {
                "Authorization": "Bearer " + access_token
            }
        }
    )
    .then(response => response.json())
    .then(async response => {
        if (response.status) {
            if (response.status == 401) {
                console.log("Token validation: Denied!")
                returnVal = 401
                return    
            }
            return
        }
        if (response.client_id) {
            console.log("Token validation: Accepted!")
            
            returnVal = 200
            validationTime = new Date()
            return
        }
        console.log(response)           // If got here, unexpected output from twitch
    })
    .catch(err => {
        console.log(err);
    });
    returnData = {
        'returnVal': returnVal,
        'validationTime': validationTime
    }
    return returnData
}

module.exports = verifyToken;