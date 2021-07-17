import adhoc2
import sys
import printutils
import copy
from collections import defaultdict

MAX_ERROR_RATIO_THRESHOLD = 0.2
MIN_PATTERN_LENGTH = 3
USER_CONFIRMATION_WEIGHT = 2

class PatternFinder:
	def __init__(self, send_message):
		self.actions = []
		self.suspected_result = None
		self.suspected_result_last_index = None
		self.send_message = send_message

		
	def log(self, s):
		if self.send_message is None:
			print(s)
		else:
			self.send_message(s)

	def _isUserConfirmingOurSuggestion(self):
		if self.suspected_result is None:
			return False
		j = 0
		for i in range(self.suspected_result_last_index, len(self.actions)):
			index = j % len(self.suspected_result["pattern"])
			if self.actions[i] != self.suspected_result["pattern"][index]:
				return False
			j += 1
		return True
	
	def _getSureness(self):
		len_user_confirmation = len(self.actions) - self.suspected_result_last_index
		sureness = len(self.suspected_result["pattern"]) - self.suspected_result["error"] + len_user_confirmation * USER_CONFIRMATION_WEIGHT
		self.log("<<<len={}, error={}, conf={}".format(len(self.suspected_result["pattern"]), self.suspected_result["error"], len_user_confirmation))
		return sureness

	def append(self, action):
		self.actions.append(action)
		self._suggestPattern()
		self.log("---------------")
		if self.suspected_result is None:
			return None
		else:
			self.log("sureness=" + str(self._getSureness()))
			return {
				"sureness": self._getSureness(),
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
			result["error"] / len(result["pattern"]) <= MAX_ERROR_RATIO_THRESHOLD and \
			len(result["pattern"]) >= MIN_PATTERN_LENGTH

	def _getInterpretation(self, actions):
		actions = copy.deepcopy(actions)
		PATTERNS = [("+1", lambda x: x+1), ("-1", lambda x: x-1)]
		if len(actions) == 0 or "action" not in actions[0]:
			return None
		interpreted_actions = []
		detected_any_pattern = False

		listIdsToIndices = defaultdict(list)
		for i in range(len(actions)):
			if "clickParams" in actions[i]["action"] and "list" in actions[i]["action"]["clickParams"]:
				listIdsToIndices[actions[i]["action"]["clickParams"]["list"]].append(i)

		for listId in listIdsToIndices.keys():
			listActionsIndices = listIdsToIndices[listId]
			if len(listActionsIndices) < 2:
				continue
			# propose pattern from first 2 clicks
			proposed_pattern = None
			for potential_pattern in PATTERNS:
				if _getActionListItemIndex(actions[listActionsIndices[1]]) == potential_pattern[1](_getActionListItemIndex(actions[listActionsIndices[0]])):
					proposed_pattern = potential_pattern
					break
			found_case_breaks_proposed_pattern = False
			if proposed_pattern is not None:
				# confirm proposed_pattern with next clicks
				for i in range(1, len(listActionsIndices) - 1):
					firstIndex = listActionsIndices[i]
					secondIndex = listActionsIndices[i + 1]
					if _getActionListItemIndex(actions[secondIndex]) != proposed_pattern[1](_getActionListItemIndex(actions[firstIndex])):
						found_case_breaks_proposed_pattern = True
						break
				if not found_case_breaks_proposed_pattern:
					detected_any_pattern = True
					for index in listActionsIndices:
						actions[index]["action"]["clickParams"]["list_item_index_pattern"] = proposed_pattern[0]
		if detected_any_pattern:
			return actions
		else:
			return None

	def _suggestPattern(self):
		if self.suspected_result is not None:
			if self._isUserConfirmingOurSuggestion():
				return
			else:
				self.suspected_result = None
				self.suspected_result_last_index = None
		results = []
		start_index = max(0, len(self.actions) - 50)
		logging = {}
		for i in range(start_index, len(self.actions)):
			current_actions = self.actions[i:]
			result = adhoc2.detect_repition(current_actions)
			result["log"] = self._getResultLog(result, current_actions)
			results.append(result)

			current_actions_with_indices_interpretation = self._getInterpretation(current_actions)
			if current_actions_with_indices_interpretation is None:
				continue
			result = adhoc2.detect_repition(current_actions_with_indices_interpretation)
			result["log"] = self._getResultLog(result, current_actions_with_indices_interpretation)
			results.append(result)
		sorted_results = sorted(results, key=lambda r: len(r["pattern"]) - r["error"])
		final_result = sorted_results[-1] if len(sorted_results) > 0 else None
		for result in results:
			if result == final_result:
				self.log("!!!!winner!!!!" + result["log"])
			else:
				self.log(result["log"])
		if final_result is not None and self._resultPassesErrorConstraints(final_result):
			self.suspected_result = final_result
			self.suspected_result_last_index = len(self.actions)

	def giveMePattern(self):
		if self.suspected_result is None:
			return []
		start_from_index = len(self.actions) - self.suspected_result_last_index
		return {
			"current": self.suspected_result["pattern"][start_from_index:],
			"complete": self.suspected_result["pattern"]
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
def _getActionListItemIndex(action):
	return action["action"]["clickParams"]["list_item_index"]