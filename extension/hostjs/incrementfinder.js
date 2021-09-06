const cloneDeep = require('clone-deep');
const patternutils = require("./patternutils.js");
// Gets interpretations of user patterns such as incrementing/decrementing element ids
// This works for selecting/copying/clicking if user is going up or down a list of elements
// * List/Table API:
//     * Input: only "element_id" is needed for computations in action["action"]
//     * returns ["action"]["increment_pattern"]

// const log = s => {
//     console.log("    INCREMENTFINDER: "+s);
// };

function getIncrement(actions) {
    actions = cloneDeep(actions);
    if (actions.length == 0) {
        return { actions: null, last_index_trackers: null };
    }

    let res = _getIncrements(actions);
    return { actions: res["actions"], last_index_trackers: res["last_index_trackers"] };
}

function _getIncrements(actions) {
    let last_index_trackers = {};
    // TODO(#23): allow this to work for more complex pattern (e.g click checkbox1,checkbox2 in same row then repeat across rows)
    // the solution to this is to link the increment pattern with the offset in our list of repeated actions
    // this requires integration with adhoc2 detect_repition function
    let elementTypesAndActionTypesAndTabIdsToIndices = {}; // key to []
    for (let i = 0; i < actions.length; i++) {
        let tab_id = actions[i]["tab"]["id"];
        let element_node = actions[i]["action"]["element_node"];
        let actionType = actions[i]["action"]["type"];
        // key has to match format of last_index_trackers key (TODO: Decouple this to make it more stable)
        let key = tab_id + element_node + actionType;
        if (!(key in elementTypesAndActionTypesAndTabIdsToIndices)) {
            elementTypesAndActionTypesAndTabIdsToIndices[key] = [];
        }
        elementTypesAndActionTypesAndTabIdsToIndices[key].push(i);
    }
    for (let key in elementTypesAndActionTypesAndTabIdsToIndices) {
        let elementActionsIndices = elementTypesAndActionTypesAndTabIdsToIndices[key];
        if (elementActionsIndices.length < 2) {
            continue;
        }

        let proposed_pattern = _proposeIncrement(actions[elementActionsIndices[0]], actions[elementActionsIndices[1]]);
        if (!proposed_pattern) {
            continue;
        }
        let found_case_breaks_proposed_pattern = false;

        // confirm proposed_pattern with next actions
        for (let i = 1; i < elementActionsIndices.length - 1; i++) {
            let firstIndex = elementActionsIndices[i];
            let secondIndex = elementActionsIndices[i + 1];
            if (!_incrementApplies(proposed_pattern, actions[firstIndex], actions[secondIndex])) {
                found_case_breaks_proposed_pattern = true;
                break;
            }
        }
        if (!found_case_breaks_proposed_pattern) {
            for (let index of elementActionsIndices) {
                actions[index]["action"]["increment_pattern"] = proposed_pattern;
            }
            last_index_trackers[key] = actions[elementActionsIndices[elementActionsIndices.length-1]]["action"]["element_id"];
        }
    }
    return { actions: actions, last_index_trackers: last_index_trackers };
}

function _proposeIncrement(action1, action2) {
    let i1 = action1["action"]["element_id"];
    let i2 = action2["action"]["element_id"];
    return patternutils.subtractIds(i2, i1);
}

// checks if pattern applies for 2 actions on the same element
function _incrementApplies(pattern, action1, action2) {
    let i1 = action1["action"]["element_id"];
    let i2 = action2["action"]["element_id"];
    return i2 == patternutils.addIds(pattern, i1);
}

module.exports = {
    getIncrement: getIncrement,
};