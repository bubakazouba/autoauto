// Any function in this file can be referenced elsewhere by using chrome.extension.getBackgroundPage().myFunction()
const API_KEY = 'AIzaSyDbMiUVxZ6F_zM0MCiwodGE7B6f_2lWLMA';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

function onGAPILoad() {
    gapi.client.init({
        // Don't pass client nor scope as these will init auth2, which we don't want
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    }).then(function() {
        console.log('gapi initialized, now logging in..');
        doLogin();
    });
}


chrome.runtime.onInstalled.addListener(function() {
    window.amiwaiting = false;
    console.log("Let's go let's connect!");
    connect();
    console.log("Sending heart beat!");
    sendNativeMessage({"event": "HEARTBEAT"});

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {schemes: ['http', 'https']}
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});


chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.event && msg.event.type == "USER_PRESSED_START") {
        console.log("got user pressed start");
        return sendNativeMessage({
            event: "USER_PRESSED_START",
            repitions: msg.event.repitions,
        });
    }
    if (msg.request) {
        if (msg.request.type == "WRITE_SHEET") {
            writeSheet(msg.request.sheetId, msg.request.range, msg.request.values);
        }
        else if (msg.request.type == "GET_CLIPBOARD") {
            sendResponse(getValueInClipboard());
        }
        else if (msg.request.type == "PLACE_IN_CLIPBOARD") {
            sendResponse(copy(msg.request.text));
        }
        return;
    }
    if (window.amiwaiting) {
        console.log("ignoring because amiwaiting = true");
        return;
    }
    if (msg.event) {
        // TODO: tab and enter shouldn't be ignored in textareas
        if ("keyParams" in msg.event && "key" in msg.event.keyParams && ["meta", "shift", "control", "alt", "tab", "enter"].includes(msg.event.keyParams.key.toLowerCase())) {
            // console.log("ignoring loan modifier key");
            return;
        }
        // console.log("got", pprint(msg, sender.tab.index));
        let action = {
            tab: {
                id: sender.tab.id,
                index: sender.tab.index,
                url: sender.tab.url,
            },
            action: msg.event,
            // timestamp: Date.now(),
        };
        sendNativeMessage({
            event: "ACTION",
            action: action,
        })
    }
    
});

var port = null;

function sendNativeMessage(message) {
    // console.log("sending message now", JSON.stringify(message));
    port.postMessage(JSON.stringify(message));
}

function onNativeMessage(message) {
    console.log("[HOST]", JSON.stringify(message));
    if (!message.event) {
        return;
    }
    if (message.event == "IM WORKING") {
        window.amiwaiting = true;
    }
    if (message.event == "IM DONE") {
        window.amiwaiting = false;
    }
    if (message.event == "IM SURE") {
        chrome.browserAction.setIcon({path: 'images/green.png'});
    }
    if (message.event == "IM NOT SURE") {
        chrome.browserAction.setIcon({path: 'images/red.png'});
    }
    if (!!message.event.type) {
        switch(message.event.type) {
            case "PUT_ELEMENT_IN_FOCUS":
                putElementInFocus(message);
                break;
            case "GO_TO_TAB":
                chrome.tabs.update(message.event.tab_id, { selected: true });
                break;
            case "PLACE_IN_CLIPBOARD":
                placeInClipboard(message);
                break;
            case "CLICK_ON_ELEMENT":
                clickOnElement(message);
                break;
            case "KEY_GROUP_INPUT":
                keyGroupInput(message);
                break;
            case "SHEETS_PASTE":
                sheetsPaste(message);
                break;
        }
    }
}

function onDisconnected() {
    port = null;
}

function connect() {
    console.log("connecting now");
    var hostName = "com.my_company.my_app";
    port = chrome.runtime.connectNative(hostName);
    console.log("port=", port);
    port.onMessage.addListener(onNativeMessage);
    port.onDisconnect.addListener(onDisconnected);
}