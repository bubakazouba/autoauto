const PatternFinder = require("./patternfinder.js").PatternFinder;
const automation = require("./automation.js");
const ActionsGrouper = require("./actionsgrouper.js").ActionsGrouper;

const actions_grouper = new ActionsGrouper();
const pattern_finder = new PatternFinder();
const log = function(...args) {
    console.log("  HOST", ...args);
};

const MIN_SURENESS_THRESHOLD = 5;

function handleAction(msg) {
    let action_group = actions_grouper.append(msg["action"]);
    if (!action_group || action_group.length == 0) {
        return;
    }

    let res;
    for (let groupedAction of action_group) {
        log(">>>>>I'm appending groupedAction..", groupedAction);
        res = pattern_finder.append(groupedAction);
    }
    if (!!res && res["sureness"] >= MIN_SURENESS_THRESHOLD) {
        return { "event": "IM SURE", "sureness": res["sureness"] };
    } else {
        return { "event": "IM NOT SURE" };
    }
}

function handleUserPressedStart(repitions) {
    let { actionsToTrigger, sequenceLength } = automation.detectActionsToTrigger(pattern_finder, parseInt(repitions));
    return automation.triggerActions(actionsToTrigger, sequenceLength);
}

function haltAutomation() {
    return automation.haltAutomation();
}

module.exports = {
    handleAction: handleAction,
    handleUserPressedStart: handleUserPressedStart,
    haltAutomation: haltAutomation,
};