const adhoc2 = require("./adhoc2.js");
const printutils = require("./printutils.js");
const increment_finder = require("./incrementfinder.js");
const patternutils = require("./patternutils.js");
const cloneDeep = require('clone-deep');

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
        this.last_index_trackers = {}; // map from "tab_id+element_node+action_type" to element_id
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
            "last_index_trackers": this.last_index_trackers,
        };
    }

    _getExpectedActionAccordingToOurSuspectedResult() {
        if (!this.suspected_result) {
            return null;
        }
        let index = this.actions.length - this.suspected_result_last_index - 1;
        index = index % this.suspected_result["pattern"].length;
        return this.suspected_result["pattern"][index];
    }

    _isUsersLastActionConfirmingSuggestion() {
        let expectedAction = this._getExpectedActionAccordingToOurSuspectedResult();
        return this._actionIsEqualTo(expectedAction, this.actions[this.actions.length - 1]);
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
                let expectedAction = this._getExpectedActionAccordingToOurSuspectedResult();
                let expectedActionStr = printutils.getPrettyPrintAction(expectedAction);
                let actionStr = printutils.getPrettyPrintAction(action);
                log(`User didnt confirm our suggestion expected: ${expectedActionStr}, "but got", ${actionStr}`);
                this.suspected_result = null;
                this.suspected_result_last_index = null;
            }
        }
        let results = [];
        let start_index = Math.max(0, this.actions.length - MAX_ACTIONS_LENGTH);
        for (let i = start_index; i < this.actions.length; i++) {
            let current_actions = this.actions.slice(i);
            let res = increment_finder.getIncrement(current_actions);
            let current_actions_with_increment_detection = res.actions;
            let last_index_trackers = res.last_index_trackers;
            if (!current_actions_with_increment_detection) {
                continue;
            }
            let result = adhoc2.detectRepition(current_actions_with_increment_detection);
            if (!!result) {
                result["log"] = this._getResultLog(result, current_actions_with_increment_detection);
                result["last_index_trackers"] = last_index_trackers;
                results.push(result);
            }
        }
        let sorted_results = results.sort((a, b) => {
            return (a["pattern"].length - a["error"]) - (b["pattern"].length - b["error"]);
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
            if ("last_index_trackers" in final_result) {
                this.last_index_trackers = { ...this.last_index_trackers, ...final_result["last_index_trackers"] };
                log("updated last_index_trackers to", this.last_index_trackers);
                delete final_result["last_index_trackers"];
            }
            this.suspected_result = final_result;
            this.suspected_result_last_index = this.actions.length;
        }

        for (let result of results) {
            if ("last_index_trackers" in result) {
                delete result["last_index_trackers"];
            }
        }
    }

    _getResultLog(result, actions) {
        if (result["pattern"].length == 0) {
            return "no pattern";
        }
        // Error, Error Ratio, Pattern, From
        let s = `E:${result["error"]}||ER:${result["error"]/result["pattern"].length}||P:${printutils.getPrettyPrintActions(result["pattern"])}||F:${printutils.getPrettyPrintActions(actions)}`;
        if (this._resultPassesErrorConstraints(result)) {
            return "error < threshold =" + s;
        } else {
            return "error > threshold =" + s;
        }
    }
    // checks if 2 actions are "equal"
    // order is important action1 should preceed action2 since we confirm increment patterns
    _actionIsEqualTo(action1, action2) {
        // Ideally "increment_pattern" is in both action1 and action2, unfortunately we will only
        // use the pattern in action1 since we are tightly coupling this to 
        // _isUsersLastActionConfirmingSuggestion where the first argument is the suspected result
        if ("increment_pattern" in action1["action"]) {
            log(">>>>theres increment_pattern");
            let i1 = action1["action"]["element_id"];
            let i2 = action2["action"]["element_id"];
            let tab_id = action1["tab"]["id"];
            let element_node = action1["action"]["element_node"];
            let pattern = action1["action"]["increment_pattern"];
            let actionType = action1["action"]["type"];
            let last_index_trackers_key = tab_id + element_node + actionType;
            if (!(last_index_trackers_key in this.last_index_trackers)) {
                this.last_index_trackers[last_index_trackers_key] = i1;
            }

            let does_action_2_follow_predicted_pattern = i2 == patternutils.addIds(pattern, this.last_index_trackers[last_index_trackers_key]);
            if (!does_action_2_follow_predicted_pattern) {
                return false;
            }
            action1 = cloneDeep(action1);
            action2 = cloneDeep(action2);
            delete action1["action"]["element_id"];
            delete action1["action"]["increment_pattern"];
            delete action2["action"]["element_id"];
            let does_it_follow_and_are_they_equal = does_action_2_follow_predicted_pattern && JSON.stringify(action1) == JSON.stringify(action2);
            // TODO: this is super hacky and we need a more rigid way of checking and updating the last_index_trackers object
            // so it doesnt fail if we just check for equality
            if (does_it_follow_and_are_they_equal) {
                // Only update if user is still confirming the pattern
                this.last_index_trackers[last_index_trackers_key] = i2;
            }
        }
        if (action1["action"]["type"] == action2["action"]["type"] == "KEY_GROUP_INPUT") {
            action1 = cloneDeep(action1);
            action2 = cloneDeep(action2);
            action1["action"]["keyGroup"] = action1["action"]["keyGroup"].jsonify();
            action2["action"]["keyGroup"] = action2["action"]["keyGroup"].jsonify();
            return JSON.stringify(action1) == JSON.stringify(action2);
        } else {
            return JSON.stringify(action1) == JSON.stringify(action2);
        }
    }
}
module.exports = {
    PatternFinder: PatternFinder,
};