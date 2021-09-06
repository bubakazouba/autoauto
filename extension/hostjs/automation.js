// import time
const cloneDeep = require('clone-deep');
const patternutils = require("./patternutils.js");
const storage = require("../storage.js");

const log = function(...args) {
    console.log("    AUTOMATION", ...args);
};

function _getActionWithIncrementedElementId(action, last_index_trackers) {
    if ("increment_pattern" in action["action"]) {
        action = cloneDeep(action);
        let tabId = action["tab"]["id"];
        let element_node = action["action"]["element_node"];
        let actionType = action["action"]["type"];
        let key = tabId+element_node+actionType;
        action["action"]["element_id"] = patternutils.addIds(action["action"]["increment_pattern"], last_index_trackers[key]);
        last_index_trackers[key] = action["action"]["element_id"];
    }

    return action;
}

function _triggerKeyGroupInputCommand(action){
    let elementId = action["action"]["element_id"];
    let tabId = action["tab"]["id"];
    let keyGroup = action["action"]["keyGroup"].jsonify();
    let request = { action: 'KEY_GROUP_INPUT', params: { id: elementId, keyGroup: keyGroup } };
    log("keyGroupInput request=", request, "tabId=", tabId);
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, request, function() {
            resolve(true);
        });
    });
}
function _triggerClickCommand(action, last_index_trackers){
    action = _getActionWithIncrementedElementId(action, last_index_trackers);
    
    let elementId = action["action"]["element_id"];
    let tabId = action["tab"]["id"];
    let request = { action: 'CLICK_ON_ELEMENT', params: { id: elementId } };
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, request, function() {
            resolve(true);
        });
    });
}
function _triggerSheetsPaste(action, last_index_trackers){
    action = _getActionWithIncrementedElementId(action, last_index_trackers);
    let elementId = action["action"]["element_id"];
    let tabId = action["tab"]["id"];

    return new Promise(resolve => {
        storage.getUserSheetSetting().then(userSheetSetting => {
            let request = { action: 'SHEETS_PASTE', params: { id: elementId,  userSheetSetting: userSheetSetting } };
            log("PASTE request=", request, "tabId=", tabId);
            chrome.tabs.sendMessage(tabId, request, function() {
                resolve(true);
            });
        });
    });
}
function _triggerSwitchingTab(tabId){
    chrome.tabs.update(tabId, { selected: true });
}

function _triggerPlaceClipboard(action, last_index_trackers){
    action = _getActionWithIncrementedElementId(action, last_index_trackers);
    let elementId = action["action"]["element_id"];
    let tabId = action["tab"]["id"];
    log("[placeInClipboard] element_id=", elementId);
    
    let request = { action: 'PLACE_IN_CLIPBOARD', params: { id: elementId } };
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, request, function(response) {
            log("[placeInClipboard] got back from content script", response);
            resolve(true);
        });
    })
}

function triggerActions(actions, last_index_trackers){
    log("actions.length to trigger=", actions.length);
    let lastTabId = null;
    let i = 0;
    return new Promise(resolve => {
        function _act() {
            if (i >= actions.length) {
                return resolve(true);
            }
            let action = actions[i++];
            // only switch tab if we need to, we dont need to switch tabs to put stuff in the clipboard
            // if (lastTabId != action["tab"]["id"] && action["action"]["type"] != "PLACE_IN_CLIPBOARD") {
            //     _triggerSwitchingTab(action["tab"]["id"]);
            // }
            if (action["action"]["type"] == "PLACE_IN_CLIPBOARD") {
                log(">>>>>>>>>>>PLACE_IN_CLIPBOARD<<<<<<<<");
                return _triggerPlaceClipboard(action, last_index_trackers).then(_act);
            }
            else if (action["action"]["type"] == "CLICK") {
                log(">>>>>>>>>>>CLICK<<<<<<<<");
                lastTabId = action["tab"]["id"];
                return _triggerClickCommand(action, last_index_trackers).then(_act);
            }
            else if (action["action"]["type"] == "KEY_GROUP_INPUT") {
                log(">>>>>>>>>>>KEY_GROUP_INPUT<<<<<<<<");
                lastTabId = action["tab"]["id"];
                return _triggerKeyGroupInputCommand(action).then(_act);
            }
            else if (action["action"]["type"] == "SHEETS_PASTE") {
                log(">>>>>>>>>>>SHEETS_PASTE<<<<<<<<");
                lastTabId = action["tab"]["id"];
                return _triggerSheetsPaste(action, last_index_trackers).then(_act);
            }
        }
        _act();
    });
}
function detectActionsToTrigger(pattern_finder, repitions) {
    let res = pattern_finder.giveMePattern();
    let repeatedActions = Array(repitions - 1).fill(res["complete"]).flat();
    let actionsToTrigger = [...res["current"], ...repeatedActions];
    log("got stuff back from patternfinder len(all)=", actionsToTrigger.length);
    return { actionsToTrigger: actionsToTrigger, last_index_trackers: res["last_index_trackers"] };
}

module.exports = {
    detectActionsToTrigger: detectActionsToTrigger,
    triggerActions: triggerActions,
};