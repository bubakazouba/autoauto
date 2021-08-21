from collections import defaultdict
import copy
import patternutils
# Gets interpretations of user patterns such as incrementing/decrementing numbers
# This currently only works for PLACE_IN_CLIPBOARD action types
# selecting/clicking list indices if user is going up or down the list
# * List/Table API:
#     * Input: only "element_id" is needed for computations in action["action"]
#     * returns ["action"]["increment_pattern"]
def getIncrement(actions, log):
    actions = copy.deepcopy(actions)
    if len(actions) == 0:
        return None, None
    interpreted_actions = []

    actions, detected_any_pattern, last_index_trackers = _getIncrements(actions, log)
    # if detected_any_pattern:
    #     return actions, last_index_trackers
    # else:
    #     return None, None
    return actions, last_index_trackers

def _getIncrements(actions, log):
    last_index_trackers = {}
    detected_any_pattern = False
    # TODO: allow this to work for more complex pattern (e.g click checkbox1,checkbox2 in same row then repeat across rows)
    elementTypesAndActionTypesAndTabIdsToIndices = defaultdict(list)
    for i in range(len(actions)):
        if "PLACE_IN_CLIPBOARD" == actions[i]["action"]["type"]:
            elementTypesAndActionTypesAndTabIdsToIndices[actions[i]["action"]["element_node"]+actions[i]["action"]["type"]+str(actions[i]["tab"]["id"])].append(i)
    for key in elementTypesAndActionTypesAndTabIdsToIndices.keys():
        elementActionsIndices = elementTypesAndActionTypesAndTabIdsToIndices[key]
        if len(elementActionsIndices) < 2:
            continue

        proposed_pattern = proposeIncrement(actions[elementActionsIndices[0]], actions[elementActionsIndices[1]])
        if proposed_pattern is None:
            continue
        found_case_breaks_proposed_pattern = False

        # confirm proposed_pattern with next actions
        for i in range(1, len(elementActionsIndices) - 1):
            firstIndex = elementActionsIndices[i]
            secondIndex = elementActionsIndices[i + 1]
            if not incrementApplies(proposed_pattern, actions[firstIndex], actions[secondIndex]):
                found_case_breaks_proposed_pattern = True
                break
        if not found_case_breaks_proposed_pattern:
            detected_any_pattern = True
            for index in elementActionsIndices:
                actions[index]["action"]["increment_pattern"] = proposed_pattern
            last_index_trackers[actions[index]["tab"]["id"]] = actions[elementActionsIndices[-1]]["action"]["element_id"]
    return actions, detected_any_pattern, last_index_trackers

def proposeIncrement(action1, action2):
    i1 = action1["action"]["element_id"]
    i2 = action2["action"]["element_id"]
    return patternutils.subtractIds(i2, i1)

# checks if pattern applies for 2 actions on the same element
def incrementApplies(pattern, action1, action2):
    i1 = action1["action"]["element_id"]
    i2 = action2["action"]["element_id"]
    return i2 == patternutils.addIds(pattern, i1)