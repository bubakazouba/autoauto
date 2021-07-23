chrome.runtime.onInstalled.addListener(function() {
    window.imparsinglist = false;
    window.amiwaiting = false;
    window.lists = {};
    window.tables = {};
    window.lastRepition = [];
    console.log("lets go lets connect");
    connect();
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
    if (msg.event && msg.event.type == "USER_PRESSED_STOP") {
        console.log("got user pressed stop");
        sendNativeMessage({
            event: "USER_PRESSED_STOP",
            repitions: msg.event.repitions,
        });
    }
    if (window.amiwaiting) {
        console.log("ignoring because amiwaiting = true");
        return;
    }

    if (msg.event && ["CLICK", "KEYBOARD", "SELECTION"].includes(msg.event.type)) {
        console.log("got", pprint(msg, sender.tab.index));
        if ("keyParams" in msg.event && ["Meta", "Shift", "Control", "Alt"].includes(msg.event.keyParams.key)) {
            // console.log("ignoring loan modifier key");
            return;
        }
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
    console.log("sending message now", JSON.stringify(message));
    port.postMessage(JSON.stringify(message));
}

function onNativeMessage(message) {
    console.log("[HOST]", JSON.stringify(message));
    if (message.event == "IM WORKING") {
        window.amiwaiting = true;
    }
    if (message.event == "IM DONE") {
        window.amiwaiting = false;
    }
    if (message.event == "IM SURE") {
        chrome.browserAction.setIcon({path: 'extension/images/green.png'});
    }
    if (message.event == "IM NOT SURE") {
        chrome.browserAction.setIcon({path: 'extension/images/red.png'});
    }
    if (message.event && message.event.type == "PUT_ELEMENT_IN_FOCUS") {
        putElementInFocus(message);
    }
    if (message.event && message.event.type == "GO_TO_TAB") {
        chrome.tabs.update(message.event.tab_id, { selected: true });
    }
    if (message.event && message.event.type == "PLACE_IN_CLIPBOARD") {
        placeInClipboard(message);
    }
    if (message.event && message.event.type == "CLICK_ON_ELEMENT") {
        clickOnElement(message);
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