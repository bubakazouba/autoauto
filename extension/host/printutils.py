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
	arr = []
	for action in actions:
		if action["action"]["type"] == "KEYBOARD":
			arr.append("{}{}'{}'".format(action["action"]["type"][:5], action["action"]["element_id"], get_keyboard_string_from_key_params(action["action"]["keyParams"])))
		elif action["action"]["type"] in ["CLICK", "SELECTION"]:
			arr.append(_getPrettyPrintClick(action))
	return ','.join(arr)

def _getPrettyPrintClick(action):
	if "item_index" in action["action"]:
		if "increment_pattern" in action["action"]:
			return "{}{}[{}] I={}".format(action["action"]["type"][:5], action["action"]["element_id"][:5], action["action"]["item_index"], action["action"]["increment_pattern"][0])
		else:
			return "{}{}[{}]".format(action["action"]["type"][:5], action["action"]["element_id"][:5], action["action"]["item_index"])
	else:
		return "{}{}{}".format(action["action"]["type"][:5], action["action"]["element_type"], action["action"]["element_id"][:5])