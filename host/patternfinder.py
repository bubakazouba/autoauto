import adhoc2
import sys
import printutils
import interpretationdetection

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

			current_actions_with_indices_interpretation = interpretationdetection.getInterpretation(current_actions, self.log)
			if current_actions_with_indices_interpretation is None:
				continue
			result = adhoc2.detect_repition(current_actions_with_indices_interpretation)
			result["log"] = self._getResultLog(result, current_actions_with_indices_interpretation)
			results.append(result)
		sorted_results = sorted(results, key=lambda r: len(r["pattern"]) - r["error"])
		final_result = sorted_results[-1] if len(sorted_results) > 0 else None

		# reason we log the results later is to highlight the winner when logging
		for result in results:
			if result == final_result:
				self.log("!!!!winner!!!!" + result["log"])
			# else:
			# 	self.log(result["log"])
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