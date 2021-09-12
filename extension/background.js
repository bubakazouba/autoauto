/* global gapi */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "onGAPILoad" }] */
const host = require("./hostjs/host.js"),
    oauthutils = require("./oauth/oauthutils.js"),
    sheets = require("./oauth/sheets.js"),
    backgroundutils = require("./backgroundutils.js"),
    storage = require("./storage.js");

// Any function in this file can be referenced elsewhere by using chrome.extension.getBackgroundPage().myFunction()
const API_KEY = 'AIzaSyDbMiUVxZ6F_zM0MCiwodGE7B6f_2lWLMA';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

function initGAPI() {
    gapi.client.init({
        // Don't pass client nor scope as these will init auth2, which we don't want
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    }).then(function() {
        console.log('gapi initialized, now logging in..');
        oauthutils.doLogin(gapi);
    });
}

window.onGAPILoad = function() {
    storage.getUserSheetSetting().then(value => {
        if (value == "API") {
            initGAPI();
        }
    });
};


window.onload = function() {
    window.amiwaiting = false;

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { schemes: ['http', 'https'] }
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
};

function handlePopupRequest(msg, sendResponse) {
    if (!msg.event) {
        return;
    }
    if (msg.event.type == "USER_PRESSED_START") {
        console.log("got user pressed start");
        window.amiwaiting = true;
        host.handleUserPressedStart(msg.event.repitions).then(() => {
            window.amiwaiting = false;
        });
        sendResponse("ok");
    } else if (["USER_PRESSED_USE_API", "USER_PRESSED_USE_PASTE"].includes(msg.event.type)) {
        storage.storeUserSheetSetting(msg.event.type).then((value) => {
            if (value == "API") {
                initGAPI();
            }
            sendResponse({ "text": value });
        });
    } else if (msg.event.type == "GET_POPUP_STATE") {
        storage.getUserSheetSetting().then((value) => {
            sendResponse({ 
                "whatAmIUsingText": value,
                amiwaiting: window.amiwaiting
            });
        });
    } else if (msg.event.type == "CLEAR_SHEET_SETTING") {
        storage.clearUserSheetSetting();
        sendResponse("ok");
    } else if (msg.event.type == "HALT_AUTOMATION") {
        host.haltAutomation();
        window.amiwaiting = false;
        sendResponse("ok");
    } else if (msg.event.type == "USER_SELECTED_SPEED_MODE") {
        host.changeSpeed(msg.event.mode);
    }
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (sender.url.startsWith("chrome-extension://") && sender.url.endsWith("/popup.html")) {
        handlePopupRequest(msg, sendResponse);
        // true indicates we wish to sendResponse asynchronously https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
        return true;
    }
    if (msg.request) {
        if (msg.request.type == "WRITE_SHEET") {
            // this can happen async so we respond immediately that we are done
            sheets.writeSheet(gapi, msg.request.sheetId, msg.request.range, msg.request.values);
            return sendResponse(true);
        } else if (msg.request.type == "GET_CLIPBOARD") {
            return sendResponse(backgroundutils.getValueInClipboard());
        } else if (msg.request.type == "PLACE_IN_CLIPBOARD") {
            return sendResponse(backgroundutils.copy(msg.request.text));
        }
        return true;
    }
    if (window.amiwaiting) {
        console.log("ignoring because amiwaiting = true");
        return;
    }
    if (msg.event) {
        // console.log("got", backgroundutils.pprint(msg, sender.tab.index));
        let action = {
            tab: {
                id: sender.tab.id,
                index: sender.tab.index,
                url: sender.tab.url,
            },
            action: msg.event,
            // timestamp: Date.now(),
        };
        handleAction({
            event: "ACTION",
            action: action,
        });
    }
});

function handleAction(msg) {
    let res = host.handleAction(msg);
    if (!res) {
        return;
    }
    if (res["event"] == "IM SURE") {
        chrome.browserAction.setIcon({ path: 'images/green.png' });
    } else {
        chrome.browserAction.setIcon({ path: 'images/red.png' });
    }
}