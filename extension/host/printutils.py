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
    return ','.join([getPrettyPrintAction(action) for action in actions])

def getPrettyPrintAction(action):
    if action is None:
        return "None"
    actionType = action["action"]["type"]
    if actionType == "KEYBOARD":
        return _getPrettyPrintKeyboard(action)
    elif actionType == "KEY_GROUP_INPUT":
        return "{}{} KeyGroup='{}'".format(actionType, action["action"]["element_id"], str(action["action"]["keyGroup"]))
    elif actionType in ["CLICK"]:
        return _getPrettyPrintClick(action)
    elif actionType in ["PLACE_IN_CLIPBOARD"]:
        return _getPrettyPrintPlaceInClipboard(action)

def _getPrettyPrintPlaceInClipboard(action):
    s = "{}{}".format(action["action"]["type"], action["action"]["element_id"])
    if "increment_pattern" in action["action"]:
        s += " I={}".format(action["action"]["increment_pattern"])
    return s

def _getPrettyPrintClick(action):
    return "{}{}{}".format(action["action"]["type"], action["action"]["element_node"], action["action"]["element_id"])

def _getPrettyPrintKeyboard(action):
    return "{}{} Key='{}'".format(action["action"]["type"], action["action"]["element_id"], get_keyboard_string_from_key_params(action["action"]["keyParams"]))