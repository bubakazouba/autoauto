import adhoc2
import sys
import printutils
import increment_finder
import copy
import json
import patternutils

MAX_ERROR_RATIO_THRESHOLD = 0.2
USER_CONFIRMATION_WEIGHT = 2
MAX_ACTIONS_LENGTH = 100

class PatternFinder:
    def __init__(self, log):
        self.log = log
        self.actions = []
        self.suspected_result = None
        self.suspected_result_last_index = None
        # TODO: this needs to be smarter, one tab can contain multiple increment patterns where
        # we would want to track the last index
        self.last_index_trackers = {} # map from tab id to element_id
        self.incrementFinderLog = lambda s : self.log("    INCREMENTFINDER: " + s)

    def _getExpectedActionAccordingToOurSuspectedResult(self):
        if self.suspected_result is None:
            return None
        index = len(self.actions) - self.suspected_result_last_index - 1
        index = index % len(self.suspected_result["pattern"])
        return self.suspected_result["pattern"][index]
        
    def _isUsersLastActionConfirmingSuggestion(self):
        expectedAction = self._getExpectedActionAccordingToOurSuspectedResult()
        return self._actionIsEqualTo(expectedAction, self.actions[-1])
    
    def _getSureness(self):
        len_user_confirmation = len(self.actions) - self.suspected_result_last_index
        sureness = len(self.suspected_result["pattern"]) - self.suspected_result["error"] + len_user_confirmation * USER_CONFIRMATION_WEIGHT
        self.log("<<<len={}, error={}, confirmation={}".format(len(self.suspected_result["pattern"]), self.suspected_result["error"], len_user_confirmation))
        return sureness

    def append(self, action):
        self.actions.append(action)
        self._suggestPattern()
        self.log("---------------")
        if self.suspected_result is None:
            return None
        else:
            sureness = self._getSureness()
            self.log("sureness=" + str(sureness))
            return {
                "sureness": sureness,
                "suspected_result": self.suspected_result,
                "sureness_breakdown": {
                    "len": len(self.suspected_result["pattern"]),
                    "error": self.suspected_result["error"],
                    "len_user_confirmation": len(self.actions) - self.suspected_result_last_index,
                    "how_many_times_user_completed_suggestion": (len(self.actions) - self.suspected_result_last_index)/len(self.suspected_result["pattern"])
                }
            }

    def _resultPassesErrorConstraints(self, result):
        return len(result["pattern"]) > 0 and \
            result["error"] / len(result["pattern"]) <= MAX_ERROR_RATIO_THRESHOLD

    def _suggestPattern(self):
        action = self.actions[-1]
        if self.suspected_result is not None:
            if self._isUsersLastActionConfirmingSuggestion():
                self.log("user is confirming our suggestion")
                return
            else:
                expectedAction = self._getExpectedActionAccordingToOurSuspectedResult()
                expectedActionStr = printutils.getPrettyPrintAction(expectedAction)
                actionStr = printutils.getPrettyPrintAction(action)
                self.log("User didnt confirm our suggestion expected: {}, {}".format(expectedActionStr, actionStr))
                self.suspected_result = None
                self.suspected_result_last_index = None
        results = []
        start_index = max(0, len(self.actions) - MAX_ACTIONS_LENGTH)
        for i in range(start_index, len(self.actions)):
            current_actions = self.actions[i:]
            current_actions_with_increment_detection, last_index_trackers = increment_finder.getIncrement(current_actions, self.incrementFinderLog)
            if current_actions_with_increment_detection is None:
                continue
            result = adhoc2.detect_repition(current_actions_with_increment_detection)
            if result is not None:
                result["log"] = self._getResultLog(result, current_actions_with_increment_detection)
                result["last_index_trackers"] = last_index_trackers
                results.append(result)
        sorted_results = sorted(results, key=lambda r: len(r["pattern"]) - r["error"])
        final_result = sorted_results[-1] if len(sorted_results) > 0 else None

        # reason we log the results later is to highlight the winner when logging
        for result in results:
            if result == final_result:
                self.log("!!!!winner!!!!" + result["log"])
            # else:
            #     self.log(result["log"])
            del result["log"]

        if final_result is not None and self._resultPassesErrorConstraints(final_result):
            if "last_index_trackers" in final_result:
                self.last_index_trackers.update(final_result["last_index_trackers"])
                del final_result["last_index_trackers"]
            self.suspected_result = final_result
            self.suspected_result_last_index = len(self.actions)

        for result in results:
            if "last_index_trackers" in result:
                del result["last_index_trackers"]

    def giveMePattern(self):
        if self.suspected_result is None:
            return None
        start_from_index = (len(self.actions) - self.suspected_result_last_index) % len(self.suspected_result["pattern"])
        self.log("start_from_index={}-{}={} % {}={}".format(len(self.actions),self.suspected_result_last_index,len(self.actions)-self.suspected_result_last_index, len(self.suspected_result["pattern"]), start_from_index))
        return {
            "current": self.suspected_result["pattern"][start_from_index:],
            "complete": self.suspected_result["pattern"],
            "last_index_trackers": self.last_index_trackers,
        }

    def _getResultLog(self, result, actions):
        if len(result["pattern"]) == 0:
            return "no pattern"
        # Error, Error Ratio, Pattern, From
        s = "E:{}||ER:{}||P:{}||F:{}".format(result["error"], result["error"]/len(result["pattern"]),
            printutils.getPrettyPrintActions(result["pattern"]), printutils.getPrettyPrintActions(actions))
        if self._resultPassesErrorConstraints(result):
            return "error < threshold =" + s
        else:
            return "error > threshold =" + s

    # checks if 2 actions are "equal"
    # order is important action1 should preceed action2 since we confirm increment patterns
    def _actionIsEqualTo(self, action1, action2):
        # Ideally "pattern" is in both action1 and action2, unfortunately we will only use the pattern
        # in action1 since we are tightly coupling this to _isUsersLastActionConfirmingSuggestion where the second argument is the suspected result
        if "increment_pattern" in action1["action"] and "PLACE_IN_CLIPBOARD" == action1["action"]["type"] and "PLACE_IN_CLIPBOARD" == action2["action"]["type"]:
            element_id = action1["action"]["element_id"]
            i1 = action1["action"]["element_id"]
            i2 = action2["action"]["element_id"]
            tab_id = action1["tab"]["id"]
            pattern = action1["action"]["increment_pattern"]
            if tab_id not in self.last_index_trackers:
                self.last_index_trackers[tab_id] = i1

            does_action_2_follow_predicted_pattern = i2 == patternutils.addIds(pattern, self.last_index_trackers[tab_id])
            action1 = copy.deepcopy(action1)
            action2 = copy.deepcopy(action2)
            del action1["action"]["element_id"]
            del action1["action"]["increment_pattern"]
            del action2["action"]["element_id"]
            does_it_follow_and_are_they_equal = does_action_2_follow_predicted_pattern and action1 == action2
            # TODO: this is super hacky and we need a more rigid way of checking and updating the last_index_trackers object
            # so it doesnt fail if we just check for equality
            if does_it_follow_and_are_they_equal:
                # Only update if user is still confirming the pattern
                self.last_index_trackers[tab_id] = i2
            return does_it_follow_and_are_they_equal
        elif action1["action"]["type"] == "KEY_GROUP_INPUT" and action2["action"]["type"] == "KEY_GROUP_INPUT":
            action1 = copy.deepcopy(action1)
            action2 = copy.deepcopy(action2)
            action1["action"]["keyGroup"] = action1["action"]["keyGroup"].jsonify()
            action2["action"]["keyGroup"] = action2["action"]["keyGroup"].jsonify()
            return str(action1) == str(action2)
        else:
            return action1 == action2