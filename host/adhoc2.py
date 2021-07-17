import editdistance
import copy

def detect_repition(actions):
	actionsstr = [_getActionStringToCompare(action) for action in actions]
	n = len(actions)
	min_editdistance = 9999
	min_eval = None
	for i in range(n):
		x1 = actionsstr[:i]
		x2 = actionsstr[i:]
		dis = editdistance.eval(x1, x2)
		if dis < min_editdistance:
			# print('dis=', dis, x1,x2)
			min_eval = actions[:i]
			if len(x2)<len(x1):
				min_eval = actions[i:]
			min_editdistance = dis

	return {
		"error": min_editdistance,
		"pattern": min_eval
	}

def _getActionStringToCompare(action):
	action = copy.deepcopy(action)
	if "action" not in action:
		return str(action)
	if "clickParams" in action["action"] and "list_item_index_pattern" in action["action"]["clickParams"]:
		del action["action"]["clickParams"]["list_item_index"]
		return str(action)
	if "clickParams" in action["action"] and "table_item_index_pattern" in action["action"]["clickParams"]:
		del action["action"]["clickParams"]["table_item_index"]
		return str(action)
	return str(action)