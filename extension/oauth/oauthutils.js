const storage = require("./storage");
let expiresTimerId = null;
const LOGOUT_WARNING_SECONDS = 60;

function login(isImmediate=false) {
    isImmediate = false; // overriding isImmediate since its failing right now with true
    const config = {
        implicitGrantUrl: "https://accounts.google.com/o/oauth2/auth",
        clientId: "965647531879-ul5u1moe1as7b96p2rmi6qpt79m4lpos.apps.googleusercontent.com",
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly", "https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/userinfo.email"],
        REDIRECT_URL: chrome.identity.getRedirectURL("oauth2"),
    };

    let authUrl = config.implicitGrantUrl +
        '?response_type=token&client_id=' + config.clientId +
        '&scope=' + config.scopes.join(" ") +
        '&redirect_uri=' + config.REDIRECT_URL;
    if (isImmediate) {
        authUrl += "&immediate=true";
    }
    console.log("authUrl=", authUrl);

    return new Promise(resolve => {
        chrome.identity.launchWebAuthFlow({ 'url': authUrl, 'interactive': !isImmediate }, function(redirectUrl) {
            if (redirectUrl) {
                console.log('[DEBUG] launchWebAuthFlow login successful: ', redirectUrl);
            }
            else {
                console.log("[DEBUG] launchWebAuthFlow login failed. Is your redirect URL (" + chrome.identity.getRedirectURL("oauth2") + ") configured with your OAuth2 provider?");
            }
            return resolve(redirectUrl); // call the original callback now that we've intercepted what we needed
        });
    });
}

function doLogin(gapi) {
    function loginCb(redirectUrl) {
        console.log('[doLogin] RedirectURL received:', redirectUrl);
        if (redirectUrl) {
            var parsed = parse(redirectUrl.substr(chrome.identity.getRedirectURL("oauth2").length + 1));
            var expiresSeconds = Number(parsed.expires_in) || 1800;
            console.log("[doLogin] parsed=", parsed);
            console.log('[doLogin] Parsed RedirectURL:', JSON.stringify(parsed));
            let token = parsed.access_token;
            console.log("[doLogin] doLogin token=", token);
            if (token) {
                validateToken(token, function(results, err) {
                    if (err) {
                        console.log('[doLogin] OAuth2: Token failed validation');
                    }
                    else {
                        storage.storeToken(token, expiresSeconds, gapi);
                        startTimer(expiresSeconds);
                        console.log('[doLogin] OAuth2: Success');
                        return true;
                    }
                });
            }
            else {
                console.log('[doLogin] OAuth2: No token found');
            }
        }
        else {
            console.log('[doLogin] OAuth2: General error');
        }
        return null;
    }
    return Promise.all([storage.getToken(), storage.isTokenStillValid()]).then((values) => {
        let token = values[0];
        let doWeHaveToken = !!token;
        let isStillValid = values[1];
        if (doWeHaveToken && isStillValid) {
            gapi.auth.setToken({
                'access_token': token,
            });
            return true;
        }
        let isImmediate;
        if (doWeHaveToken && !isStillValid) {
            isImmediate = true;
        }
        else if (!doWeHaveToken) {
            isImmediate = false;
        }
        return login(isImmediate).then(loginCb);
    });
}

function startTimer(seconds) {
    if (expiresTimerId != null) {
        clearTimeout(expiresTimerId);
    }

    if (seconds > LOGOUT_WARNING_SECONDS) {
        expiresTimerId = setTimeout(function() {
            console.log("Automatic re-login initiating");
            doLogin();
        }, (seconds - LOGOUT_WARNING_SECONDS) * 1000); // seconds * 1000

        console.log('Token expiration re-login ', 'timer set for', seconds - LOGOUT_WARNING_SECONDS, "seconds");
    }
}

function parse(str) {
    if (typeof str !== 'string') {
        return {};
    }
    str = str.trim().replace(/^(\?|#|&)/, '');
    if (!str) {
        return {};
    }
    return str.split('&').reduce(function(ret, param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        // Firefox (pre 40) decodes `%3D` to `=`
        // https://github.com/sindresorhus/query-string/pull/37
        var key = parts.shift();
        var val = parts.length > 0 ? parts.join('=') : undefined;
        key = decodeURIComponent(key);
        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val === undefined ? null : decodeURIComponent(val);
        if (!ret.hasOwnProperty(key)) {
            ret[key] = val;
        }
        else if (Array.isArray(ret[key])) {
            ret[key].push(val);
        }
        else {
            ret[key] = [ret[key], val];
        }
        return ret;
    }, {});
}

// TODO: uncomment logic ( i think just replace $http with fetch)
function validateToken(token, callback) {
    callback(true, null);
    // var url = config.tokenInfoUrl + "?access_token=" + token;
    // $http.get(url) // fetches the config when the service is instantiated
    //     .then(
    //         function (results) {
    //           console.log('Validation Results:', JSON.stringify(results.data));
    //           callback(results, null);
    //         },
    //         function error(err) {
    //           console.log('Validation Error:', JSON.stringify(err));
    //           callback(null, err);
    //         });

}

// TODO: uncomment this and start using it
// function doRestore() {
//     var restoredToken = bgp.getLastToken(); // Data.fetch('token');

//     if (restoredToken != null) {
//         validateToken(restoredToken, function(results, err) {
//             if (err) {
//                 authenticated = false;
//                 Broadcast.send("login", getAuthStatus(false, { error: 'Token failed validation' }));
//                 $log.error('OAuth2: Token failed validation:', err);
//             } else {
//                 var expiresSeconds = results.data.expires_in;
//                 token = restoredToken;
//                 $log.debug("Restore expiresIn:", expiresSeconds);
//                 startTimer(expiresSeconds); //
//                 expires = new Date();
//                 expires = expires.setSeconds(expires.getSeconds() + expiresSeconds);
//                 authenticated = true;
//                 fetchUserInfo();
//                 Broadcast.send("login", getAuthStatus(true, null));
//                 $log.info('OAuth2 restoration: Success');
//             }
//         });
//     } else {
//         $log.debug('No token to restore');
//     }
// }
//
module.exports = {
    doLogin: doLogin,
};