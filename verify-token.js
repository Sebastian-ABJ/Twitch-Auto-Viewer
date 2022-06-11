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
                //'This token is invalid: ' + response.message;
                returnVal = 401
                return    
            }
            // 'Unexpected output with a status?';
            return;
        }
        if (response.client_id) {
            console.log("Token validation: Accepted!")
            
            returnVal = 200
            validationTime = new Date()
            // token is valid was was generated for that client_id
            return
        }
        // if got here unexpected output from twitch
    })
    .catch(err => {
        console.log(err);
        // 'An Error Occured loading token data';
    });
    returnData = {
        'returnVal': returnVal,
        'validationTime': validationTime
    }
    return returnData
}

module.exports = verifyToken;