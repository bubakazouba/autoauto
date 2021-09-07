const adhoc2 = require("./adhoc2.js");
const printutils = require("./printutils.js");
const cloneDeep = require('clone-deep');
const IncrementTracker = require("./incrementtracker.js");

const log = function(...args) {
    console.log("    PATTERNFINDER", ...args);
};
const MAX_ERROR_RATIO_THRESHOLD = 0.2;
const USER_CONFIRMATION_WEIGHT = 2;
const MAX_ACTIONS_LENGTH = 100;
const ACTIONS_TYPE_SCORE_WEIGHT = {
    "KEYBOARD": 1,
    "KEY_GROUP_INPUT": 1,
    "CLICK": 1,
    "SHEETS_PASTE": 1,
    "PLACE_IN_CLIPBOARD": 2,
};
class PatternFinder {
    constructor() {
        this.actions = [];
        this.suspected_result = null;
        this.suspected_result_last_index = null;
        // TODO: this needs to be smarter, one tab can contain multiple increment patterns where
        // we would want to track the last index
    }

    append(action) {
        this.actions.push(action);
        this._suggestPattern();
        log("---------------");
        if (!this.suspected_result) {
            return null;
        } else {
            let sureness = this._getSureness();
            log("sureness=", sureness);
            return {
                "sureness": sureness,
                "suspected_result": this.suspected_result,
                "sureness_breakdown": {
                    "len": this.suspected_result["pattern"].length,
                    "error": this.suspected_result["error"],
                    "len_user_confirmation": this.actions.length - this.suspected_result_last_index,
                    "how_many_times_user_completed_suggestion": (this.actions.length - this.suspected_result_last_index) / this.suspected_result["pattern"].length
                }
            };
        }
    }

    giveMePattern() {
        if (!this.suspected_result) {
            return null;
        }
        let start_from_index = (this.actions.length - this.suspected_result_last_index) % this.suspected_result["pattern"].length;
        return {
            "current": this.suspected_result["pattern"].slice(start_from_index),
            "complete": this.suspected_result["pattern"],
            "sequenceLength": this.suspected_result["pattern"].length,
        };
    }

    _getExpectedActionAccordingToOurSuspectedResult() {
        if (!this.suspected_result) {
            return null;
        }
        let index = this.actions.length - this.suspected_result_last_index - 1;
        index = index % this.suspected_result["pattern"].length;
        return { expectedAction: this.suspected_result["pattern"][index], actionIndex: index };
    }

    _isUsersLastActionConfirmingSuggestion() {
        let { expectedAction, actionIndex } = this._getExpectedActionAccordingToOurSuspectedResult();
        return this._actionIsEqualTo(expectedAction, this.actions[this.actions.length - 1], actionIndex);
    }

    _getSureness() {
        let len_user_confirmation = this.actions.length - this.suspected_result_last_index;
        let pattern_score = 0;
        let len_pattern = this.suspected_result["pattern"].length;
        for (let i = 0; i < len_pattern; i++) {
            let action = this.suspected_result["pattern"][i];
            pattern_score += ACTIONS_TYPE_SCORE_WEIGHT[action["action"]["type"]];
            pattern_score += ACTIONS_TYPE_SCORE_WEIGHT[action["action"]["type"]] * parseInt(len_user_confirmation / len_pattern) * USER_CONFIRMATION_WEIGHT;
            if (i < len_user_confirmation % len_pattern) {
                pattern_score += ACTIONS_TYPE_SCORE_WEIGHT[action["action"]["type"]] * USER_CONFIRMATION_WEIGHT;
            }
        }
        let sureness = pattern_score - this.suspected_result["error"];
        log(`<<<len=${len_pattern}, error=${this.suspected_result["error"]}, confirmation=${len_user_confirmation}, score=${pattern_score}`);
        return sureness;
    }

    _getSurenessForResult(result) {
        let pattern_score = 0;
        for (let i = 0; i < result["pattern"].length; i++) {
            let action = result["pattern"][i];
            pattern_score += ACTIONS_TYPE_SCORE_WEIGHT[action["action"]["type"]];
        }
        let sureness = pattern_score - result["error"];
        return sureness;
    }

    _resultPassesErrorConstraints(result) {
        return result["pattern"].length > 0 &&
            result["error"] / result["pattern"].length <= MAX_ERROR_RATIO_THRESHOLD;
    }

    _suggestPattern() {
        let action = this.actions[this.actions.length - 1];
        if (!!this.suspected_result) {
            if (this._isUsersLastActionConfirmingSuggestion()) {
                log("user is confirming our suggestion");
                return;
            } else {
                let expectedAction = this._getExpectedActionAccordingToOurSuspectedResult()["expectedAction"];
                log(`User didnt confirm our suggestion expected: ${printutils.getPrettyPrintAction(expectedAction)}, but got, ${printutils.getPrettyPrintAction(action)}`);
                this.suspected_result = null;
                this.suspected_result_last_index = null;
            }
        }
        let results = [];
        let start_index = Math.max(0, this.actions.length - MAX_ACTIONS_LENGTH);
        for (let i = start_index; i < this.actions.length; i++) {
            let current_actions = this.actions.slice(i);
            let result = adhoc2.detectRepition(current_actions);
            if (!!result) {
                result["log"] = this._getResultLog(result, current_actions);
                results.push(result);
            }
        }
        let sorted_results = results.sort((res1, res2) => {
            return this._getSurenessForResult(res1) - this._getSurenessForResult(res2);
        });
        let final_result = sorted_results.length > 0 ? sorted_results[sorted_results.length - 1] : null;

        // reason we log the results later is to highlight the winner when logging
        for (let result of results) {
            if (result == final_result) {
                log("!!!!winner!!!!", result["log"]);
            } else {
                log(result["log"]);
            }
            delete result["log"];
        }

        if (!!final_result && this._resultPassesErrorConstraints(final_result)) {
            IncrementTracker.commit(final_result["last_index_trackers"], final_result["increment_patterns"]);
            log("Updated IncrementTrackers to", final_result["last_index_trackers"]);
            this.suspected_result = {
                "pattern": final_result["pattern"],
                "error": final_result["error"],
            };
            this.suspected_result_last_index = this.actions.length;
        }
    }

    _getResultLog(result, actions) {
        if (result["pattern"].length == 0) {
            return "no pattern";
        }
        // Error, Error Ratio, Pattern, From
        let s = `S:${this._getSurenessForResult(result)}||E:${result["error"]}||ER:${result["error"]/result["pattern"].length}||P:${printutils.getPrettyPrintActions(result["pattern"])}||F:${printutils.getPrettyPrintActions(actions)}`;
        if (this._resultPassesErrorConstraints(result)) {
            return "error < threshold =" + s;
        } else {
            return "error > threshold =" + s;
        }
    }
    // checks if 2 actions are "equal"
    // order is important action1 should preceed action2 since we confirm and apply increment patterns
    _actionIsEqualTo(action1, action2, actionIndex) {
        let i2 = action2["action"]["element_id"];

        if (i2 != IncrementTracker.getExpectedIndex(actionIndex)) {
            return false;
        }
        action1 = cloneDeep(action1);
        action2 = cloneDeep(action2);
        delete action1["action"]["element_id"];
        delete action2["action"]["element_id"];

        // TODO: this is super hacky and we need a more rigid way of checking and updating the last_index_trackers object
        // so it doesnt fail if we just check for equality
        if (JSON.stringify(action1) == JSON.stringify(action2)) {
            // Only update if user is confirming the pattern
            IncrementTracker.updateIndexTrackerElementId(actionIndex, i2);
            return true;
        }
        return false;
    }
}
module.exports = {
    PatternFinder: PatternFinder,
};