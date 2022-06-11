const verifyToken = require("../verify-token.js")
const verify = require("../verify-token.js")
const createAuthWindow = require('../authenticate')
const millisPerHour = 60 * 60 * 1000;

onmessage = function(token) {
    let validToken = true
    console.log("Monitoring token validity...")
    wait(millisPerHour)

    while(validToken) {
        await verifyToken(token)
        .then(response => {
            if (response == 401) {
                validToken = false
            }
        })
        console.log("Token validated successfully.")
    }
    console.log("Token invalid, responding to main script.")
    postMessage(false)
}

function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, time);
    })
}