const PatternFinder = require("./patternfinder.js").PatternFinder;
const automation = require("./automation.js");
const ActionsGrouper = require("./actionsgrouper.js").ActionsGrouper;
const storage = require("../storage.js");

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

function handleUserPressedStart(repetitions) {
    storage.getLastPatternHistory().then(lastPattern => {
        lastPattern = {
            ...lastPattern,
            "did_user_pressed_start": true,
            "pressed_start": [
                ...lastPattern["pressed_start"],
                { "repitition": repetitions }
            ],
        };
        storage.updateLastPatternHistory(lastPattern);
    });
    let { actionsToTrigger, sequenceLength } = automation.detectActionsToTrigger(pattern_finder, parseInt(repetitions));
    return automation.triggerActions(actionsToTrigger, sequenceLength);
}

function haltAutomation() {
    return automation.haltAutomation();
}

function changeSpeed(mode) {
    return automation.changeSpeed(mode);
}

module.exports = {
    handleAction: handleAction,
    handleUserPressedStart: handleUserPressedStart,
    haltAutomation: haltAutomation,
    changeSpeed: changeSpeed,
};