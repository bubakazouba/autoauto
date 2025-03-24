const host = require("./hostjs/host.js"),
    backgroundutils = require("./backgroundutils.js");

window.onload = function() {
    window.amIAutomating = false;
    window.amisure = false;

    // Set initial icon
    chrome.browserAction.setIcon({ path: {"32": "../images/red.png"} });

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
        window.amIAutomating = true;
        host.handleUserPressedStart(msg.event.repetitions).then(() => {
            window.amIAutomating = false;
        });
        sendResponse("ok");
    } else if (msg.event.type == "GET_POPUP_STATE") {
        sendResponse({
            amIAutomating: window.amIAutomating,
            amisure: window.amisure,
        });
    } else if (msg.event.type == "HALT_AUTOMATION") {
        host.haltAutomation();
        window.amIAutomating = false;
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
        if (msg.request.type == "GET_CLIPBOARD") {
            return sendResponse(backgroundutils.getValueInClipboard());
        } else if (msg.request.type == "PLACE_IN_CLIPBOARD") {
            return sendResponse(backgroundutils.copy(msg.request.text));
        } else if (msg.request.type == "GET_SECONDARY_CLIPBOARD") {
            return sendResponse(backgroundutils.getSecondaryClipboard());
        } else if (msg.request.type == "PLACE_IN_SECONDARY_CLIPBOARD") {
            return sendResponse(backgroundutils.setSecondaryClipboard(msg.request.text));
        }
        return true;
    }
    if (window.amIAutomating) {
        console.log("ignoring because amIAutomating = true");
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

async function handleAction(msg) {
    try {
        const res = await host.handleAction(msg);
        if (!res) {
            return;
        }
        
        if (res["event"] == "IM SURE") {
            window.amisure = true;
            chrome.browserAction.setIcon({ path: {"32": "../images/green.png"} });
        } else {
            window.amisure = false;
            chrome.browserAction.setIcon({ path: {"32": "../images/red.png"} });
        }
    } catch (error) {
        console.error("Error in handleAction:", error);
        window.amisure = false;
        chrome.browserAction.setIcon({ path: {"32": "../images/red.png"} });
    }
}
