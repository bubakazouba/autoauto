import copy
import time
import os
import sys
from subprocess import Popen
from browserio import send_message
import printutils
import patternutils
import keyboard

def log(s):
    send_message("    AUTOMATION: "+s)

def trigger_key_group_input_command(action):
    send_message({
        "event": {
            "type": "KEY_GROUP_INPUT",
            "element_id": action["action"]["element_id"],
            "tab_id": action["tab"]["id"],
            "keyGroup": action["action"]["keyGroup"].jsonify()
        }
    })

def triggger_click_command(action, last_index_trackers):
    action = copy.deepcopy(action)

    if "increment_pattern" in action["action"]:
        tab_id = action["tab"]["id"]
        element_node = action["action"]["element_node"]
        action["action"]["element_id"] = patternutils.addIds(action["action"]["increment_pattern"], last_index_trackers[str(tab_id)+element_node])
        last_index_trackers[str(tab_id)+element_node] = action["action"]["element_id"]

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
    keyboard.press_and_release(cmd)

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

def _trigger_place_clipboard(action, last_index_trackers):
    action = copy.deepcopy(action)

    if "increment_pattern" in action["action"]:
        tab_id = action["tab"]["id"]
        element_node = action["action"]["element_node"]
        action["action"]["element_id"] = patternutils.addIds(action["action"]["increment_pattern"], last_index_trackers[str(tab_id)+element_node])
        last_index_trackers[str(tab_id)+element_node] = action["action"]["element_id"]

    send_message({
        "event": {
            "type": "PLACE_IN_CLIPBOARD",
            "tab_id": action["tab"]["id"],
            "element_id": action["action"]["element_id"],
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
            _trigger_place_clipboard(action, last_index_trackers)
        elif action["action"]["type"] == "CLICK":
            send_message(">>>>>>>>>>>CLICK<<<<<<<<")
            triggger_click_command(action, last_index_trackers)
            last_tab_id = action["tab"]["id"]
        elif action["action"]["type"] == "KEY_GROUP_INPUT":
            send_message(">>>>>>>>>>>KEY_GROUP_INPUT<<<<<<<<")
            trigger_key_group_input_command(action)
            last_tab_id = action["tab"]["id"]
        last_element_id = action["action"]["element_id"]
        time.sleep(0.8)
    enable_extension_keyboard_listener()

def detect_actions_to_trigger(pattern_finder, repitions):
    res = pattern_finder.giveMePattern()
    send_message("got stuff back from patternfinder len(all)="+str(len(res["current"] + res["complete"] * (repitions - 1))))
    return res["current"] + res["complete"] * (repitions - 1), res["last_index_trackers"]
