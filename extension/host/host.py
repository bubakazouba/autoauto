#!/usr/bin/env python3
import json
import patternfinder
import copy
from actionsgrouper import ActionsGrouper
from browserio import send_message, get_message
from automation import detect_actions_to_trigger, trigger_actions

MIN_SURENESS_THRESHOLD = 5

def _getSerializableResult(res):
    res = copy.deepcopy(res)
    return res

pattern_finder = patternfinder.PatternFinder(lambda s: send_message("PATTERNFINDER: "+s))
actions_grouper = ActionsGrouper(lambda s: send_message("    ACTIONGROUPER: "+s))

def handleAction(msg):
    action_group = actions_grouper.append(msg["action"])
    if action_group is None:
        return
    
    for groupedAction in action_group:
        send_message(">>>>>I'm appending groupedAction.." + str(groupedAction))
        res = pattern_finder.append(groupedAction)

        if res is not None and res["sureness"] >= MIN_SURENESS_THRESHOLD:
            send_message({"event": "IM SURE", "sureness": res["sureness"]})
        else:
            send_message({"event": "IM NOT SURE"})

def main():
    # results_file = open("/tmp/myresults", "a")
    # last_res = None
    while True:
        msg = {}
        message = get_message()
        try:
            msg = json.loads(message)
        except Exception as e:
            send_message("dumbo i cant parse ur 'json'" + message)
            continue

        if "event" not in msg:
            send_message("dumbass send a valid msg")
            continue
        if msg["event"] == "HEARTBEAT":
            send_message("I'm alive")
            continue
        if msg["event"] == "ACTION":
            handleAction(msg)
            # if res is None and last_res is None:
            #     pass
            # else:
            #     if res is None:
            #         results_file.write("None")
            #     else:
            #         res["timestamp"] = int(time.time())
            #         res = _getSerializableResult(res)
            #         results_file.write(json.dumps(res))
            # last_res = res
            continue
        if msg["event"] == "USER_PRESSED_START":
            actionsToTrigger, last_index_trackers = detect_actions_to_trigger(pattern_finder, int(msg["repitions"]))
            trigger_actions(actionsToTrigger, last_index_trackers)
            continue

if __name__ == "__main__":
    main()