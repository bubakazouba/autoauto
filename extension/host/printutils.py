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
    arr = []
    for action in actions:
        actionType = action["action"]["type"]
        if actionType == "KEYBOARD":
            arr.append(_getPrettyPrintKeyboard(action))
        elif actionType == "KEY_GROUP_INPUT":
            arr.append("{}{} KeyGroup='{}'".format(actionType, action["action"]["element_id"], str(action["action"]["keyGroup"])))
        elif actionType in ["CLICK", "PLACE_IN_CLIPBOARD"]:
            arr.append(_getPrettyPrintClick(action))
    return ','.join(arr)

def _getPrettyPrintClick(action):
    if "item_index" in action["action"]:
        s = "{}{}[{}]".format(action["action"]["type"], action["action"]["element_id"][:5], action["action"]["item_index"])
        if "increment_pattern" in action["action"]:
            s += " I={}".format(action["action"]["increment_pattern"][0])
        return s
    else:
        return "{}{}{}".format(action["action"]["type"], action["action"]["element_node"], action["action"]["element_id"][:5])

def _getPrettyPrintKeyboard(action):
    return "{}{} Key='{}'".format(action["action"]["type"], action["action"]["element_id"], get_keyboard_string_from_key_params(action["action"]["keyParams"]))