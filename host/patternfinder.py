import adhoc2

MAX_ERROR_RATIO_THRESHOLD = 0.1
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
		self.log("<<<<<<len="+ str(len(self.suspected_result["pattern"])) + "error="+ str(self.suspected_result["error"]) + "conf=" + str(len_user_confirmation))
		return sureness

	def append(self, action):
		self.actions.append(action)
		self._suggestPattern()
		if self.suspected_result is None:
			return None
		else:
			return {
				"sureness": self._getSureness()
			}

	def _suggestPattern(self):
		if self.suspected_result is not None:
			if self._isUserConfirmingOurSuggestion():
				return
			else:
				self.suspected_result = None
				self.suspected_result_last_index = None
		results = []
		start_index = max(0, len(self.actions) - 100)
		for i in range(start_index, len(self.actions)):
			result = adhoc2.detect_repition(self.actions[i:])
			sss = ""
			# temp hack since unit tests dont conform to the same format for now
			if type(self.actions[0]) == type({}) and "action" in self.actions[0]:
				sss = ',m'.join([x["action"]["keyParams"]["key"] for x in result["pattern"]])
			if len(result["pattern"]) > 0 and result["error"] / len(result["pattern"]) <= MAX_ERROR_RATIO_THRESHOLD and len(result["pattern"]) >= MIN_PATTERN_LENGTH:
				self.log("error < threshold =" + str(result["error"]) + "||" + sss)
				results.append(result)
			else:
				self.log("error too high =" + str(result["error"]) + "||" + sss)
				pass
		sorted_results = sorted(results, key=lambda r: len(r["pattern"])-r["error"])
		final_result = sorted_results[-1] if len(sorted_results) > 0 else None
		
		if final_result is not None:
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