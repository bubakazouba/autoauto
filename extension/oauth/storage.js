const TOKEN_KEY = "TOKEN";
const IS_TOKEN_EXPIRED_KEY = "IS_TOKEN_EXPIRED";

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
        chrome.storage.sync.get([IS_TOKEN_EXPIRED_KEY], function(result) {
            console.log('[Storage][Get] Is Token Expired Value currently is ' + result[IS_TOKEN_EXPIRED_KEY]);
            resolve(!!result[IS_TOKEN_EXPIRED_KEY]);
        });
    });
}

function isTokenStillValid() {
    return isTokenExpired().then(val => {
        return !val;
    });
}

function storeToken(token) {
    gapi.auth.setToken({
        'access_token': token,
    });
    chrome.storage.sync.set({
        [TOKEN_KEY]: token
    }, function(result) {
        console.log('[Storage][Set] Token value is set to ' + token);
    });

    chrome.storage.sync.set({
        [IS_TOKEN_EXPIRED_KEY]: false
    }, function(result) {
        console.log('[Storage][Set] Is Token Expired value is set to ' + false);
    });
}

function markTokenAsExpired() {
    chrome.storage.sync.set({
        [IS_TOKEN_EXPIRED_KEY]: true
    }, function(result) {
        console.log('[Storage][Set] Is Token Expired value is set to ' + true, 'result=', result);
    });
}

function clearalltokens() {
    chrome.storage.sync.set({
        [TOKEN_EXPIRATION_TIME_KEY]: 0
    }, function(result) {
        console.log('[Storage] [Clear] Cleared token expired key');
    });

    chrome.storage.sync.set({
        [TOKEN_KEY]: undefined
    }, function(result) {
        console.log('[Storage] [Clear] Cleared token');
    });
}