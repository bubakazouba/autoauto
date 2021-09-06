/* global gapi */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "onGAPILoad" }] */
const host = require("./hostjs/host.js");
const oauthutils = require("./oauth/oauthutils.js");
const sheets = require("./oauth/sheets.js");
const backgroundutils = require("./backgroundutils.js");

// Any function in this file can be referenced elsewhere by using chrome.extension.getBackgroundPage().myFunction()
const API_KEY = 'AIzaSyDbMiUVxZ6F_zM0MCiwodGE7B6f_2lWLMA';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

window.onGAPILoad = function() {
    gapi.client.init({
        // Don't pass client nor scope as these will init auth2, which we don't want
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    }).then(function() {
        console.log('gapi initialized, now logging in..');
        oauthutils.doLogin(gapi);
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


chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.event && msg.event.type == "USER_PRESSED_START") {
        console.log("got user pressed start");
        window.amiwaiting = true;
        host.handleUserPressedStart(msg.event.repitions).then(() => {
            window.amiwaiting = false;
        });
    }
    if (msg.request) {
        if (msg.request.type == "WRITE_SHEET") {
            sheets.writeSheet(gapi, msg.request.sheetId, msg.request.range, msg.request.values);
        }
        else if (msg.request.type == "GET_CLIPBOARD") {
            sendResponse(backgroundutils.getValueInClipboard());
        }
        else if (msg.request.type == "PLACE_IN_CLIPBOARD") {
            sendResponse(backgroundutils.copy(msg.request.text));
        }
        return;
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
        console.log("event == IMSURE");
        chrome.browserAction.setIcon({ path: 'images/green.png' });
    }
    else {
        console.log("event != IMSURE");
        chrome.browserAction.setIcon({ path: 'images/red.png' });
    }
}