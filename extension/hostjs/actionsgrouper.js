const KeyGrouper = require("./keygrouper.js").KeyGrouper;
const cloneDeep = require('clone-deep');

const log = function(...args) {
    console.log("    ACTIONSGROUPER", ...args);
};

// Responsible for only reporting user actions that we would want to automate them
//   e.g dont report SELECT if not followed by copy/replace
// Responsible for grouping actions
//   keystrokes on the same text field are grouped together so they are returned as 1 grouped action
class ActionsGrouper {
    constructor() {
        // we store last action of altered keygroup so we have all data like tab info..etc to submit for patternfinder
        this.unsubmittedKeyGroupActionsDict = {}; // {tabId: {elementId: action}}
        this.keyGroupDict = {}; // {tabId: {elementId: KeyGrouper}} 
        this.selectionDict = {}; // {tabId: {elementId: [selection start, selection end]}} 
    }

    append(action) {
        if (this._actionIsOnEditableElement(action)) {
            // TODO: only create a new KeyGroup on re-focus if keyGroup for element was submitted (or if it didn't exist before) 
            if (action["action"]["type"] == "FOCUS" && this._isActionOnEditableElementIsSubmitted(action)) {
                this._setKeyGroupForAction(action, new KeyGrouper(action["action"]["keyGroupInput"]["value"]));
            } else if (["KEY_GROUP_INPUT", "KEY_GROUP_PASTE", "KEY_GROUP_SELECTION"].includes(action["action"]["type"])) {
                this._appendKeyGroupAction(action);
            }
            return null;
        } else {
            // if action is clicking/selecting
            let res = [];
            if (action["action"]["type"] == "CLICK") {
                log("click");
                // Only submit keyGroups and report them back if we clicked on a button
                // (assuming here that clicking on this button is submitting the text in the web page)
                let unsubmittedKeyGroupActions = this._getAndSubmitUnsubmittedKeyGroupsInTab(action["tab"]["id"]);
                for (let a of unsubmittedKeyGroupActions) {
                    a = cloneDeep(a);
                    delete a["action"]["keyParams"];
                    delete a["action"]["keyGroupInput"];
                    // standardize to KEY_GROUP_INPUT, havent found a need to differentiate after this point
                    a["action"]["type"] = "KEY_GROUP_INPUT";
                    a["action"]["keyGroup"] = this._getKeyGroupForAction(a);
                    res.push(a);
                }
                res.push(action);
            } else if (["PLACE_IN_CLIPBOARD", "SHEETS_PASTE"].includes(action["action"]["type"])) {
                log("PLACE_IN_CLIPBOARD or SHEETS_PASTE");
                res.push(action);
            } else if (action["action"]["type"] == "UNLOAD") {
                log("UNLOAD");
                this._clearAllDictsForTab(action["tab"]["id"]);
            }
            return res;
        }
    }

    _setKeyGroupForAction(action, keyGroup) {
        if (!this.keyGroupDict[action["tab"]["id"]]) {
            this.keyGroupDict[action["tab"]["id"]] = {};
        }
        this.keyGroupDict[action["tab"]["id"]][action["action"]["element_id"]] = keyGroup;
    }

    // selection is [startOffset, endOffset] or undefined
    _setSelectionForAction(action, selection) {
        if (!this.selectionDict[action["tab"]["id"]]) {
            this.selectionDict[action["tab"]["id"]] = {};
        }
        this.selectionDict[action["tab"]["id"]][action["action"]["element_id"]] = selection;
    }
    _getKeyGroupForAction(action) {
        if (!!this.keyGroupDict[action["tab"]["id"]]) {
            return this.keyGroupDict[action["tab"]["id"]][action["action"]["element_id"]];
        }
    }
    _getSelectionForAction(action) {
        if (!!this.selectionDict[action["tab"]["id"]]) {
            return this.selectionDict[action["tab"]["id"]][action["action"]["element_id"]];
        }
    }
    _clearAllDictsForTab(tab_id) {
        delete this.keyGroupDict[tab_id];
        delete this.selectionDict[tab_id];
        delete this.unsubmittedKeyGroupActionsDict[tab_id];
    }
    _markUnsubmittedKeyGroup(action) {
        if (!this.unsubmittedKeyGroupActionsDict[action["tab"]["id"]]) {
            this.unsubmittedKeyGroupActionsDict[action["tab"]["id"]] = {};
        }
        this.unsubmittedKeyGroupActionsDict[action["tab"]["id"]][action["action"]["element_id"]] = action;
    }
    _getAndSubmitUnsubmittedKeyGroupsInTab(tabId) {
        let l = [];
        let keys = Object.keys(this.unsubmittedKeyGroupActionsDict[tabId] || {});
        for (let elementId of keys) {
            l.push(this.unsubmittedKeyGroupActionsDict[tabId][elementId]);
            delete this.unsubmittedKeyGroupActionsDict[tabId][elementId];
        }
        return l;
    }
    _isActionOnEditableElementIsSubmitted(action) {
        if (!this.unsubmittedKeyGroupActionsDict[action["tab"]["id"]]) {
            this.unsubmittedKeyGroupActionsDict[action["tab"]["id"]] = {};
        }
        return !(action["action"]["element_id"] in this.unsubmittedKeyGroupActionsDict[action["tab"]["id"]]);
    }
    _updateSelectionDict(action) {
        let keyGroupInput = action["action"]["keyGroupInput"];
        let startOffset = keyGroupInput["startOffset"];
        let endOffset = "endOffset" in keyGroupInput ? keyGroupInput["endOffset"] : null;
        log(`_updateSelectionDict: [${startOffset},${endOffset}]`);
        if (endOffset != null && startOffset != endOffset) {
            this._setSelectionForAction(action, [startOffset, endOffset]);
        } else {
            this._setSelectionForAction(action, undefined);
        }
    }
    _appendKeyGroupAction(action) {
        let actionType = action["action"]["type"];

        if (actionType == "KEY_GROUP_SELECTION") {
            return this._updateSelectionDict(action);
        }
        // Check for no-ops first
        if (actionType == "KEY_GROUP_INPUT") {
            let keyParams = action["action"]["keyParams"];
            let is_loan_modifier_key = ["meta", "shift", "control", "alt", "tab", "enter", "capslock"].includes(keyParams["key"].toLowerCase());
            // We don't care about:
            //   * (cmd|ctrl)+(shift)+a (text manuvering/selections) since they are handled by "KEY_GROUP_SELECTION"
            //   * (cmd+ctrl)+(c|v) since they are handled by PLACE_IN_CLIPBOARD and KEY_GROUP_PASTE
            //   * (cmd|ctrl)+f,(cmd|ctrl)+d (any browser shortcuts)
            if (is_loan_modifier_key || keyParams["ctrlKey"] || keyParams["metaKey"]) {
                return;
            }
        }

        // Starting here all actions are destructive ones (character or cmd+v or backspace)
        this._markUnsubmittedKeyGroup(action);
        if (!!this._getSelectionForAction(action)) {
            let [selectionStartOffset, selectionEndOffset] = this._getSelectionForAction(action);
            log("There is selection and a destructive action deleting selected range: " + selectionStartOffset + "," + selectionEndOffset);
            this._getKeyGroupForAction(action).deleteTextAtOffsetRange(selectionStartOffset, selectionEndOffset);
        }
        if (actionType == "KEY_GROUP_INPUT") {
            this._appendInputActionInKeyGroup(action);
        } else if (actionType == "KEY_GROUP_PASTE") {
            this._appendPasteActionInKeyGroup(action);
        }

        log("now keygroup=" + this._getKeyGroupForAction(action));
        this._updateSelectionDict(action);
    }
    _appendPasteActionInKeyGroup(action) {
        let keyGroupInput = action["action"]["keyGroupInput"];
        let startOffset = keyGroupInput["startOffset"];
        let clipboard = keyGroupInput["clipboard"];
        this._getKeyGroupForAction(action).appendPasteAtOffset(clipboard, startOffset);
    }
    _appendInputActionInKeyGroup(action) {
        let keyParams = action["action"]["keyParams"];
        let keyGroupInput = action["action"]["keyGroupInput"];
        let startOffset = keyGroupInput["startOffset"];
        let key = keyParams["key"];

        if (key == "Backspace" && !keyParams["metaKey"]) {
            // if there was selection then we have already taken care of it
            if (!this._getSelectionForAction(action)) {
                this._getKeyGroupForAction(action).deleteTextAtOffset(startOffset - 1);
                log("I sent deleteTextAtOffset: " + (startOffset - 1));
            }
        } else if (key == "Backspace" && keyParams["metaKey"]) { // TODO: add also alt+delete
            // if there was selection then we have already taken care of it
            if (!this._getSelectionForAction(action)) {
                this._getKeyGroupForAction(action).deleteTextAtOffsetRange(0, startOffset);
                log("I sent deleteTextAtOffsetRange(0, : " + (startOffset - 1) + ")");
            }
        } else {
            log("im appending text");
            this._getKeyGroupForAction(action).appendTextAtOffset(key, startOffset);
        }
    }
    _actionIsOnEditableElement(action) {
        return action["action"]["element_node"] == "INPUT";
    }
}

module.exports = {
    ActionsGrouper: ActionsGrouper,
};