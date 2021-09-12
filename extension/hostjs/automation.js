// import time
const cloneDeep = require('clone-deep');
const storage = require("../storage.js");
const IncrementTracker = require("./incrementtracker.js");
const DEFAULT_MODE = "slowmode";
const MODE_TO_SPEED = {
    "slowmode": 800,
    "mediummode": 300,
    "quickmode": 25,
};
const log = function(...args) {
    console.log("    AUTOMATION", ...args);
};

let shouldHaltAutomation = false;
let currentMode = DEFAULT_MODE;

function haltAutomation() {
    shouldHaltAutomation = true;
}

function changeSpeed(mode) {
    log("changing speed to mode=", mode);
    currentMode = mode;
}

function triggerActions(actions, sequenceLength) {
    shouldHaltAutomation = false;
    let lastTabId = null;
    let i = 0;
    return new Promise(resolve => {
        function _act() {
            if (i >= actions.length || shouldHaltAutomation) {
                return resolve(true);
            }
            let action = actions[i];
            let actionIndex = i % sequenceLength;
            i++;
            // Only switch tabs if there's time to do so
            if (currentMode != "quickmode") {
                // only switch tab if we need to, we dont need to switch tabs to put stuff in the clipboard
                if (lastTabId != action["tab"]["id"] && action["action"]["type"] != "PLACE_IN_CLIPBOARD") {
                    _triggerSwitchingTab(action["tab"]["id"]);
                }
            }
            if (action["action"]["type"] == "PLACE_IN_CLIPBOARD") {
                log(">>>>>>>>>>>PLACE_IN_CLIPBOARD<<<<<<<<");
                return _triggerPlaceClipboard(action, actionIndex).then(_waitThenActWrapper);
            } else if (action["action"]["type"] == "CLICK") {
                log(">>>>>>>>>>>CLICK<<<<<<<<");
                lastTabId = action["tab"]["id"];
                return _triggerClickCommand(action, actionIndex).then(_waitThenActWrapper);
            } else if (action["action"]["type"] == "KEY_GROUP_INPUT") {
                log(">>>>>>>>>>>KEY_GROUP_INPUT<<<<<<<<");
                lastTabId = action["tab"]["id"];
                return _triggerKeyGroupInputCommand(action, actionIndex).then(_waitThenActWrapper);
            } else if (action["action"]["type"] == "SHEETS_PASTE") {
                log(">>>>>>>>>>>SHEETS_PASTE<<<<<<<<");
                lastTabId = action["tab"]["id"];
                return _triggerSheetsPaste(action, actionIndex).then(_waitThenActWrapper);
            }
        }
        function _waitThenActWrapper() {
            _waitThenAct(0);
        }
        function _waitThenAct(timeout) {
            if (!timeout) {
                timeout = MODE_TO_SPEED[currentMode];
            }
            setTimeout(_act, timeout);
        }
        _waitThenAct();
    });
}

function detectActionsToTrigger(pattern_finder, repitions) {
    let res = pattern_finder.giveMePattern();
    let repeatedActions = Array(repitions - 1).fill(res["complete"]).flat();
    let actionsToTrigger = [...res["current"], ...repeatedActions];
    log("got stuff back from patternfinder len(actionsToTrigger)=", actionsToTrigger.length);
    return {
        actionsToTrigger: actionsToTrigger,
        sequenceLength: res["sequenceLength"]
    };
}

function _getActionWithIncrementedElementId(action, actionIndex) {
    action = cloneDeep(action);
    action["action"]["element_id"] = IncrementTracker.getExpectedIndex(actionIndex);
    IncrementTracker.updateIndexTrackerElementId(actionIndex, action);
    return action;
}

function _triggerKeyGroupInputCommand(action, actionIndex) {
    action = _getActionWithIncrementedElementId(action, actionIndex);

    let elementId = action["action"]["element_id"];
    let tabId = action["tab"]["id"];
    let keyGroup = action["action"]["keyGroup"].toJSON();
    let request = { action: 'KEY_GROUP_INPUT', params: { id: elementId, keyGroup: keyGroup } };
    log("keyGroupInput request=", request, "tabId=", tabId);
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, request, function() {
            resolve(true);
        });
    });
}

function _triggerClickCommand(action, actionIndex) {
    action = _getActionWithIncrementedElementId(action, actionIndex);

    let elementId = action["action"]["element_id"];
    let tabId = action["tab"]["id"];
    let request = { action: 'CLICK_ON_ELEMENT', params: { id: elementId } };
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, request, function() {
            resolve(true);
        });
    });
}

function _triggerSheetsPaste(action, actionIndex) {
    action = _getActionWithIncrementedElementId(action, actionIndex);
    let elementId = action["action"]["element_id"];
    let tabId = action["tab"]["id"];

    return new Promise(resolve => {
        storage.getUserSheetSetting().then(userSheetSetting => {
            let request = { action: 'SHEETS_PASTE', params: { id: elementId, userSheetSetting: userSheetSetting } };
            log("PASTE request=", request, "tabId=", tabId);
            chrome.tabs.sendMessage(tabId, request, function() {
                resolve(true);
            });
        });
    });
}

function _triggerSwitchingTab(tabId) {
    chrome.tabs.update(tabId, { selected: true });
}

function _triggerPlaceClipboard(action, actionIndex) {
    action = _getActionWithIncrementedElementId(action, actionIndex);
    let elementId = action["action"]["element_id"];
    let tabId = action["tab"]["id"];
    log("[placeInClipboard] element_id=", elementId);

    let request = { action: 'PLACE_IN_CLIPBOARD', params: { id: elementId } };
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, request, function(response) {
            log("[placeInClipboard] got back from content script", response);
            resolve(true);
        });
    });
}

module.exports = {
    detectActionsToTrigger: detectActionsToTrigger,
    triggerActions: triggerActions,
    haltAutomation: haltAutomation,
    changeSpeed: changeSpeed,
};