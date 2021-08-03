import editdistance
import copy

def detect_repition(actions):
    # TODO: Action should be a class with an __eq__ override where it can do smart stuff like
    # 1- checking if keyGroup guesses are equal and returning that guess
    #   if nth char is always replaced with uppercased letter
    #   all delimiters replaced with spaces..etc
    # 2- checking if theres an increment pattern and using that to compare
    # or maybe these checks should happen in another class like IncrementFinder? 
    actionsstr = [_getActionStringToCompare(action) for action in actions]
    n = len(actions)
    min_editdistance = 9999
    min_eval = None
    for i in range(1, n):
        x1 = actionsstr[:i]
        x2 = actionsstr[i:]
        dis = editdistance.eval(x1, x2)
        if dis < min_editdistance:
            min_eval = actions[:i]
            if len(x2)<len(x1):
                min_eval = actions[i:]
            min_editdistance = dis

    if min_eval is None:
        return None
    return {
        "error": min_editdistance,
        "pattern": min_eval
    }

def _getActionStringToCompare(action):
    if "increment_pattern" in action["action"] and "item_index" in action["action"]:
        action = copy.deepcopy(action)
        del action["action"]["item_index"]
    if action["action"]["type"] == "KEY_GROUP_INPUT":
        action = copy.deepcopy(action)
        action["action"]["keyGroup"] = action["action"]["keyGroup"].jsonify()
    return str(action)