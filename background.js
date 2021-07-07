chrome.runtime.onInstalled.addListener(function() {
    window.imparsinglist = false;
    window.amiwaiting = false;
    window.lists = {};
    window.tables = {};
    window.lastRepition = [];
    console.log("lets go lets connect");
    connect();
});


chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (window.amiwaiting) {
        console.log("ignoring because amiwaiting = true");
        return;
    }
    if (["Meta", "Shift", "Control", "Alt"].indexOf(msg.text.key) != -1) {
        // console.log("ignoring loan modifier key");
        return;
    }
    sendResponse("Gotcha! " + JSON.stringify(msg));

    let action = {
        tab: {
            id: sender.tab.id,
            index: sender.tab.index,
            url: sender.tab.url,
        },
        action: {
            type: "KEYBOARD",
            element: null,
            keyParams: msg.text
        },
        timestamp: Date.now(),
    };
    console.log("got", actionToString(action));
    sendNativeMessage(action);
});

var port = null;

function sendNativeMessage(message) {
    console.log("sending message now", JSON.stringify(message));
    port.postMessage(message);
}

function onNativeMessage(message) {
    console.log("[HOST]", message);
    if (message.event == "IM WORKING") {
        window.amiwaiting = true;
    }
    if (message.event == "IM DONE") {
        window.amiwaiting = false;
    }
    if (message.action && message.action.type == "GO_TO_TAB") {
        chrome.tabs.update(message.action.tab_id, { selected: true });
    }
    if (message.action && message.action.type == "PLACE_IN_CLIPBOARD") {
        placeInClipboard(message);
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