from collections import defaultdict
import copy
# Gets interpretations of user patterns such as incrementing/decrementing numbers
# selecting/clicking list indices if user is going up or down the list
# * List/Table API:
# 	* Input: add "itemIndex" (int or list(int)) to action["action"]
# 	* returns ["action"]["pattern"]
def getIncrement(actions, log):
	actions = copy.deepcopy(actions)
	if len(actions) == 0:
		return None, None
	interpreted_actions = []

	actions, detected_any_pattern, last_index_trackers = _getIncrements(actions, log)
	if detected_any_pattern:
		return actions, last_index_trackers
	else:
		return None, None

def _getIncrements(actions, log):
	last_index_trackers = {}
	detected_any_pattern = False
	# TODO: separate this by action type (click vs selection)
	# e.g user could click a checkbox in the list then select some field. these 2 should be tracked separately
	elementIdsToIndices = defaultdict(list)
	for i in range(len(actions)):
		if "item_index" in actions[i]["action"]:
			elementIdsToIndices[actions[i]["action"]["element_id"]].append(i)
	for elementId in elementIdsToIndices.keys():
		elementActionsIndices = elementIdsToIndices[elementId]
		if len(elementActionsIndices) < 2:
			continue

		proposed_pattern = proposeIncrement(actions[elementActionsIndices[0]], actions[elementActionsIndices[1]])
		found_case_breaks_proposed_pattern = False

		# confirm proposed_pattern with next clicks
		for i in range(1, len(elementActionsIndices) - 1):
			firstIndex = elementActionsIndices[i]
			secondIndex = elementActionsIndices[i + 1]
			if not incrementApplies(proposed_pattern, actions[firstIndex], actions[secondIndex]):
				found_case_breaks_proposed_pattern = True
				break
		if not found_case_breaks_proposed_pattern:
			detected_any_pattern = True
			for index in elementActionsIndices:
				actions[index]["action"]["pattern"] = proposed_pattern
			last_index_trackers[actions[0]["action"]["element_id"]] = actions[elementActionsIndices[-1]]["action"]["item_index"]
	return actions, detected_any_pattern, last_index_trackers

def proposeIncrement(action1, action2):
	i1 = action1["action"]["item_index"]
	i2 = action2["action"]["item_index"]
	if type(i2) == type(0):
		d = i2 - i1
		if d >= 0:
			d = "+" + str(d)
		return (str(d), eval("lambda i: i {}".format(d)))
	if type(i2) == type([]):
		l = "lambda i:" 
		arr = []
		strarr = []
		for j in range(len(i1)):
			d = i2[j] - i1[j]
			if d >= 0:
				d = "+" + str(d)
			arr.append("i[{}] {}".format(j, d))
			strarr.append(d)
		l = l + "("+",".join(arr) + ")"
		return ("("+",".join(strarr)+")", eval(l))

# checks if pattern applies for 2 actions on the same element
def incrementApplies(pattern, action1, action2):
	i1 = action1["action"]["item_index"]
	i2 = action2["action"]["item_index"]
	return i2 == pattern[1](i1)