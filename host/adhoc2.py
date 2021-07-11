import editdistance
def detect_repition(actions):
	actionsstr = [str(x) for x in actions]
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