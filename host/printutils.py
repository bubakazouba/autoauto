def get_keyboard_string_from_key_params(keyParams):
    s = keyParams["key"]
    if s[:5] == "Arrow":  # ArrowDown -> Down
        s = s[5:]
    if s in ["Meta", "Shift", "Control", "Alt"]:  # Ignore a lone Meta
        return ""
    if keyParams["metaKey"]:
        s = "cmd+" + s
    if keyParams["ctrlKey"]:
        s = "ctrl+" + s
    if keyParams["shiftKey"]:
        s = "shift+" + s
    if keyParams["altKey"]:
        s = "alt+" + s
    return s

def getPrettyPrintActions(actions):
	if len(actions) == 0:
		return "nothing"
	# temp hack since unit tests dont conform to the same format for now
	if type(actions[0]) == type({}) and "action" in actions[0]:
		arr = []
		for action in actions:
			if action["action"]["type"] == "KEYBOARD":
				arr.append("{}'{}'".format(action["action"]["element"], get_keyboard_string_from_key_params(action["action"]["keyParams"])))
			elif action["action"]["type"] == "MOUSE_CLICK":
				arr.append(_getPrettyPrintClick(action))
		return ','.join(arr)
	else:
		return ','.join([action["key"] for action in actions])

def _getPrettyPrintClick(action):
	if "item_index" in action["action"]["clickParams"]:
		if "pattern" in action["action"]:
			return "{}[{}] I={}".format(action["action"]["clickParams"]["element_id"][:5], action["action"]["clickParams"]["item_index"], action["action"]["pattern"])
		else:
			return "{}[{}]".format(action["action"]["clickParams"]["element_id"][:5], action["action"]["clickParams"]["item_index"])
	else:
		return "{}{}".format(action["action"]["clickParams"]["element_type"], action["action"]["clickParams"]["element_id"][:5])