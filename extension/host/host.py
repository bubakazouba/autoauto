#!/usr/bin/env python3
import nativemessaging
import json
import os
import sys
import time
from subprocess import Popen
import patternfinder
import printutils
import copy
from actionsgrouper import ActionsGrouper

KEYBOARD_LISTENER_PATH = os.path.abspath(os.path.dirname(__file__)) + "/keyboard_listener.py"
MIN_SURENESS_THRESHOLD = 10

def send_message(s):
    nativemessaging.send_message(nativemessaging.encode_message(s))

def trigger_key_group_input_command(action):
    send_message({
        "event": {
            "type": "KEY_GROUP_INPUT",
            "element_id": action["action"]["element_id"],
            "tab_id": action["tab"]["id"],
            "keyGroup": action["action"]["keyGroup"].jsonify()
        }
    })

def triggger_click_command(action):
    send_message({
        "event": {
            "type": "CLICK_ON_ELEMENT",
            "element_id": action["action"]["element_id"],
            "tab_id": action["tab"]["id"]
        }
    })

def put_element_in_focus(element_id, tab_id):
    send_message({
        "event": {
            "type": "PUT_ELEMENT_IN_FOCUS",
            "element_id": element_id,
            "tab_id": tab_id
        }
    })
def trigger_keyboard_command(action, should_refocus=True):
    if "element_id" in action["action"] and should_refocus:
        put_element_in_focus(action["action"]["element_id"], action["tab"]["id"])
        time.sleep(0.3)
    cmd = printutils.get_keyboard_string_from_key_params(action["action"]["keyParams"])
    if sys.platform == "darwin":
        Popen([KEYBOARD_LISTENER_PATH, cmd])
    else:
        Popen(["sudo", KEYBOARD_LISTENER_PATH, cmd])

def trigger_switching_tab(tab_id):
    send_message({
        "event": {
            "type": "GO_TO_TAB",
            "tab_id": tab_id
        }
    })

def disable_extension_keyboard_listener():
    send_message({"event": "IM WORKING"})

def enable_extension_keyboard_listener():
    send_message({"event": "IM DONE"})

def detect_actions_to_trigger(pattern_finder, repitions):
    res = pattern_finder.giveMePattern()
    send_message("got stuff back from patternfinder len(all)="+str(len(res["current"] + res["complete"] * (repitions - 1))))
    return res["current"] + res["complete"] * (repitions - 1), res["last_index_trackers"]

def trigger_place_clipboard(action, last_index_trackers):
    action = copy.deepcopy(action)

    if "increment_pattern" in action["action"]:
        action["action"]["item_index"] = action["action"]["increment_pattern"][1](last_index_trackers[action["action"]["element_id"]])
        last_index_trackers[action["action"]["element_id"]] = action["action"]["item_index"]
    send_message({
        "event": {
            "type": "PLACE_IN_CLIPBOARD",
            "tab_id": action["tab"]["id"],
            "element_id": action["action"]["element_id"],
            "item_index": action["action"]["item_index"],
            "element_node": action["action"]["element_node"]
        }
    })

def trigger_actions(actions, last_index_trackers):
     # give a chance for the user to leave the popup and go back to the page
    send_message("starting in 2...")
    time.sleep(1) 
    send_message("1..")
    time.sleep(1) 
    send_message("0.")
    disable_extension_keyboard_listener()
    send_message("len(actions) to trigger=" + str(len(actions)))
    last_tab_id = None
    last_element_id = None
    for action in actions:
        # TODO: this logic makes more sense in the extension, just switch if needed there based on current tab instead of keeping state here
        # nonsense!
        # only switch tab if we need to, we dont need to switch tabs to put stuff in the clipboard
        if last_tab_id != action["tab"]["id"] and action["action"]["type"] != "PLACE_IN_CLIPBOARD":
            trigger_switching_tab(action["tab"]["id"])
        if action["action"]["type"] == "KEYBOARD":
            send_message(">>>>>>>>>>>KEYBOARD<<<<<<<<"+str(printutils.get_keyboard_string_from_key_params(action["action"]["keyParams"])))
            trigger_keyboard_command(action, should_refocus=last_element_id != action["action"]["element_id"])
            last_tab_id = action["tab"]["id"]
        elif action["action"]["type"] == "PLACE_IN_CLIPBOARD":
            send_message(">>>>>>>>>>>PLACE_IN_CLIPBOARD<<<<<<<<")
            trigger_place_clipboard(action, last_index_trackers)
        elif action["action"]["type"] == "CLICK":
            send_message(">>>>>>>>>>>CLICK<<<<<<<<")
            triggger_click_command(action)
            last_tab_id = action["tab"]["id"]
        elif action["action"]["type"] == "KEY_GROUP_INPUT":
            send_message(">>>>>>>>>>>KEY_GROUP_INPUT<<<<<<<<")
            trigger_key_group_input_command(action)
            last_tab_id = action["tab"]["id"]
        last_element_id = action["action"]["element_id"]
        time.sleep(0.8)
    enable_extension_keyboard_listener()

def _getSerializableResult(res):
    res = copy.deepcopy(res)
    for action in res["suspected_result"]["pattern"]:
        if "increment_pattern" in action["action"]:
            action["action"]["increment_pattern"] = action["action"]["increment_pattern"][0]
    return res
def main():
    pattern_finder = patternfinder.PatternFinder(lambda s: send_message("PATTERNFINDER: "+s))
    # results_file = open("/tmp/myresults", "a")
    # last_res = None
    actionsGrouper = ActionsGrouper(lambda s: send_message("ACTIONGROUPER: "+s))
    while True:
        msg = {}
        message = nativemessaging.get_message()
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
            actionGroup = actionsGrouper.append(msg["action"])
            if actionGroup is None:
                continue
            res = None
            for groupedAction in actionGroup:
                send_message(">>>>>actionGroup im appending groupedAction.." + str(groupedAction))
                res = pattern_finder.append(groupedAction)
            s = ""
            if res is not None and res["sureness"] >= MIN_SURENESS_THRESHOLD:
                send_message({"event": "IM SURE", "sureness": res["sureness"]})
            else:
                send_message({"event": "IM NOT SURE"})
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
        if msg["event"] == "USER_PRESSED_STOP":
            actionsToTrigger, last_index_trackers = detect_actions_to_trigger(pattern_finder, int(msg["repitions"]))
            trigger_actions(actionsToTrigger, last_index_trackers)
            continue

if __name__ == "__main__":
    main()