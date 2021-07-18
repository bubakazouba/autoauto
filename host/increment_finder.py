from collections import defaultdict
import copy
# Gets interpretations of user patterns such as incrementing/decrementing numbers
# selecting/clicking list indices if user is going up or down the list
# * List/Table API:
# 	* returns ["action"]["pattern"]
def getIncrement(actions, log):
	actions = copy.deepcopy(actions)
	if len(actions) == 0 or "action" not in actions[0]:
		return None
	interpreted_actions = []

	actions, detected_any_list_pattern = _getIncrements(actions, log)
	if detected_any_list_pattern:
		return actions
	else:
		return None

def _getIncrements(actions, log):
	detected_any_pattern = False
	elementIdsToIndices = defaultdict(list)
	for i in range(len(actions)):
		if "clickParams" in actions[i]["action"] and actions[i]["action"]["clickParams"]["element_type"] in ["LIST", "TABLE"]:
			elementIdsToIndices[actions[i]["action"]["clickParams"]["element_id"]].append(i)
	for elementId in elementIdsToIndices.keys():
		elementActionsIndices = elementIdsToIndices[elementId]
		if len(elementActionsIndices) < 2:
			continue
		element_type = actions[elementActionsIndices[0]]["action"]["clickParams"]["element_type"]

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
				actions[index]["action"]["pattern"] = proposed_pattern[0]
	return actions, detected_any_pattern

def proposeIncrement(action1, action2):
	i1 = action1["action"]["clickParams"]["item_index"]
	i2 = action2["action"]["clickParams"]["item_index"]
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
	element_type = action1["action"]["clickParams"]["element_type"]
	i1 = action1["action"]["clickParams"]["item_index"]
	i2 = action2["action"]["clickParams"]["item_index"]
	return i2 == pattern[1](i1)