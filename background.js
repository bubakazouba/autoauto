chrome.runtime.onInstalled.addListener(function() {
    window.amiwaiting = false;
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

    chrome.storage.local.get("yy", result => {
        if (Object.keys(result).length == 0) {
            result.yy = [];
        }
        result.yy.push({
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
            // timestamp: Date.now(),
        });
        console.log("got", actionToString(result.yy.slice(-1)[0]));
        let lastRepition = getLastRepitionIfExists(result.yy);
        if (!!lastRepition) {
            sendNativeMessage("hello");
            window.amiwaiting = true;
            console.log("found=", actionsToString(lastRepition));
            window.lastRepition = lastRepition;
            act();
        }
        chrome.storage.local.set({ "yy": result.yy }, () => {});
    });
});

function act() {
    if (window.lastRepition.length == 0) {
        window.amiwaiting = false;
        return;
    }
    let lastRepition = window.lastRepition;
    let lastIndex = getIndexOfLastSameTabAction(window.lastRepition);
    console.log("Im going to tab index=", window.lastRepition[0].tab.index);
    chrome.tabs.update(window.lastRepition[0].tab.id, { selected: true });

    window.lastRepition = lastRepition.slice(lastIndex + 1); // next time, start from after the last index
    console.log("going to act on", actionsToString(lastRepition.slice(0, lastIndex + 1)));
    sendNativeMessage(JSON.stringify(lastRepition.slice(0, lastIndex + 1)));
}

function getLastRepitionIfExists(allKeys) {
    let result = findRepitions(allKeys);
    if (!!result) {
        return result;
    }
}

function findRepitions(actions) {
    if (!actions) {
        return false
    }
    max_n = 25; // sequence of actions max of length 25
    min_n = 3; // sequence of actions at least 3
    for (n = max_n; n >= min_n; n--) {
        if (isLastNRepeatedOnce(actions, n)) {
            return actions.slice(actions.length - n, actions.length);
        }
    }
    return false;
}

var port = null;

function sendNativeMessage(message) {
    console.log("sending message now", JSON.stringify(message));
    // message = {"text": "hello"};
    port.postMessage(message);
}

function onNativeMessage(message) {
    console.log("-=-=-=-= received back message:", message);
    if (message == "done") {
        act(); // act will decide if theres anything remaining
    }
}

function onDisconnected() {
    port = null;
}

function connect() {
    console.log("connecting nowww");
    var hostName = "com.my_company.my_app";
    port = chrome.runtime.connectNative(hostName);
    console.log("port=", port);
    port.onMessage.addListener(onNativeMessage);
    port.onDisconnect.addListener(onDisconnected);
}
