from collections import deque, OrderedDict
from functools import lru_cache

MAX_ERROR_RATIO_THRESHOLD = 0.2
MIN_PATTERN_LENGTH = 3
USER_CONFIRMATION_WEIGHT = 2

SEPERATOR = '-'


class BayesianPatternFinder:
    def __init__(self):
        self.actions = []
        self.suspected_result = None
        self.suspected_result_last_index = None
        # self.send_message = send_message
        self.candidate_cycles = set()
        self.evaluated_cycles = []

    def log(self, s):
        if self.send_message is None:
            print(s)
        else:
            self.send_message(s)

    def _getSubstrStartIndicies(self, string, substr):
        return [i for i in range(
            len(string)) if string.startswith(substr, i)]

    @lru_cache(maxsize=None)
    def _getPathProbability(self, path):
        actions_str = SEPERATOR.join(self.actions)
        split_path = path.split(SEPERATOR)
        if len(split_path) == 0:
            raise Exception("path can't be empty!")
        if len(split_path) == 1:
            target = split_path[0]
            target_occurences = [idx for idx, action in enumerate(
                self.actions) if action == target]
            prob_conditioned_on_path_to_target = len(
                target_occurences)/len(self.actions)
            return prob_conditioned_on_path_to_target
        else:
            path_to_target = SEPERATOR.join(split_path[:-1])
            expected_target = split_path[-1]
            path_to_target_start_indicies = self._getSubstrStartIndicies(
                actions_str, path_to_target)
            total_occurences = len(path_to_target_start_indicies)
            if total_occurences == 0:
                raise Exception(
                    "Total occurences needs to be at least 1 because where the fuck would you have found that path!")
            occurences_ending_in_target = 0
            for idx in path_to_target_start_indicies:
                expected_target_target_at_end_of_path = actions_str.startswith(
                    expected_target, idx+len(path_to_target)+1)  # 1 is offset needed for SEPERATOR
                if expected_target_target_at_end_of_path:
                    occurences_ending_in_target += 1
            prob_conditioned_on_path_to_target = occurences_ending_in_target/total_occurences
            next_path = SEPERATOR.join(split_path[:-1])
            return prob_conditioned_on_path_to_target * self._getPathProbability(next_path)

    def _updateCandidateCycles(self):
        if len(self.actions) > 2:
            last_action = self.actions[-1]
            idx_last_action = len(self.actions)-1
            history_up_to_last_action = self.actions[:idx_last_action]
            if last_action in history_up_to_last_action:
                idx_last_occurence = -1
                while True:
                    try:
                        idx_last_occurence = history_up_to_last_action.index(
                            last_action, idx_last_occurence+1)
                    except ValueError:
                        break
                    cycle = SEPERATOR.join(
                        self.actions[idx_last_occurence:idx_last_action+1])
                    self.candidate_cycles.add(cycle)
    
    def _pruneCyclesBasedOnEquivelence(self):
        pass

    def _getCycleCandidacyMetric(self, cycle, cycle_prob):
        return cycle_prob

    def _getCycleMetrics(self):
        self._getPathProbability.cache_clear()
        cycles = []
        for cycle in self.candidate_cycles:
            cycle_metric = self._getCycleCandidacyMetric(
                cycle, self._getPathProbability(cycle))
            cycles.append((cycle, cycle_metric))
        sorted_cycles = list(sorted(cycles, key=lambda x: x[1], reverse=True))
        self.evaluated_cycles = sorted_cycles

    def clear(self):
        self.actions.clear()

    def _getSureness(self):
        pass

    def append(self, action):
        self.actions.append(action)
        self._updateCandidateCycles()
        # self._getCycleMetrics()
        # self._suggestPattern()
        # self.log("---------------")
        # if self.suspected_result is None:
        #     return None
        # else:
        #     self.log("sureness=" + str(self._getSureness()))
        #     return {
        #         "sureness": self._getSureness()
        #     }

    def _suggestPattern(self):
        pass

    def giveMePattern(self):
        patterns = []
        for cycle, metric in self.evaluated_cycles:
            pattern = cycle.split(SEPERATOR)[:-1]
            patterns.append((pattern, metric))
        return patterns
        # if self.suspected_result is None:
        #     return []
        # start_from_index = len(self.actions) - self.suspected_result_last_index
        # return {
        #     "current": self.suspected_result["pattern"][start_from_index:],
        #     "complete": self.suspected_result["pattern"]
        # }


def getPrettyPrintActions(actions):
    if len(actions) == 0:
        return "nothing"
    # temp hack since unit tests dont conform to the same format for now
    if type(actions[0]) == type({}) and "action" in actions[0]:
        return SEPERATOR.join([x["action"]["keyParams"]["key"] for x in actions])
    else:
        return SEPERATOR.join([x["key"] for x in actions])
