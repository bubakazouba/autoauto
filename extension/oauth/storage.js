const TOKEN_KEY = "TOKEN";
const TOKEN_EXPIRATION_TIME_KEY = "TOKEN_EXPIRATION_TIME_KEY";

function getToken() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([TOKEN_KEY], function(result) {
            console.log('[Storage][Get] Token Value currently is ' + result[TOKEN_KEY]);
            resolve(result[TOKEN_KEY]);
        });
    })
}

function isTokenExpired() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([TOKEN_EXPIRATION_TIME_KEY], function(result) {
            console.log('[Storage][Get] Is Token Expired Value currently is ' + 
                result[TOKEN_EXPIRATION_TIME_KEY] + " which is " + 
                secondsFromNow(result[TOKEN_EXPIRATION_TIME_KEY]) + " seconds from now");
            if (!result[TOKEN_EXPIRATION_TIME_KEY]) {
                return resolve(true);
            }
            resolve((new Date()).getTime() >= result[TOKEN_EXPIRATION_TIME_KEY] + 10 * 1000);
        });
    });
}

function isTokenStillValid() {
    return isTokenExpired().then(val => {
        return !val;
    });
}

function storeToken(token, expiresSeconds) {
    gapi.auth.setToken({
        'access_token': token,
    });
    chrome.storage.sync.set({
        [TOKEN_KEY]: token
    }, function(result) {
        console.log('[Storage][Set] Token value is set to ' + token);
    });

    let expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresSeconds);

    chrome.storage.sync.set({
        [TOKEN_EXPIRATION_TIME_KEY]: expires.getTime()
    }, function(result) {
        console.log('[Storage][Set] Token expiration time value is set to ' + expires.getTime());
    });
}


function clearalltokens() {
    chrome.storage.sync.set({
        [TOKEN_EXPIRATION_TIME_KEY]: 0
    }, function(result) {
        console.log('[Storage] [Clear] Cleared token expiration time');
    });

    chrome.storage.sync.set({
        [TOKEN_KEY]: ""
    }, function(result) {
        console.log('[Storage] [Clear] Cleared token');
    });
}

function secondsFromNow(time) {
    let delta = time - (new Date()).getTime();
    return parseInt(delta / 1000);
}