from collections import defaultdict
import copy
# Gets interpretations of user patterns such as incrementing/decrementing numbers
# selecting/clicking list indices if user is going up or down the list
# * List API:
# 	* returns ["action"]["clickParams"]["list_item_index_pattern"]
def getInterpretation(actions):
	actions = copy.deepcopy(actions)
	if len(actions) == 0 or "action" not in actions[0]:
		return None
	interpreted_actions = []

	actions, detected_any_list_pattern = _getListInterpretations(actions)
	if detected_any_list_pattern:
		return actions
	else:
		return None

def _getListInterpretations(actions):
	PATTERNS = [("+1", lambda x: x+1), ("-1", lambda x: x-1)]
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
	return actions, detected_any_pattern

def _getActionListItemIndex(action):
	return action["action"]["clickParams"]["list_item_index"]