#!/usr/bin/env python3
import nativemessaging
import json
import os
import time
from subprocess import Popen

KEYBOARD_LISTENER_PATH = os.path.abspath(os.path.dirname(__file__)) + "/keyboard_listener.py"

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

def send_message(s):
    nativemessaging.send_message(nativemessaging.encode_message(s))

def trigger_keyboard_command(keyParams):
    cmd = get_keyboard_string_from_key_params(keyParams)
    Popen(["sudo", KEYBOARD_LISTENER_PATH, cmd])

def trigger_switching_tab(tabId):
    send_message({
        "event": {
            "type": "GO_TO_TAB",
            "tab_id": tabId
        }
    })

def disable_extension_keyboard_listener():
    send_message({"event": "IM WORKING"})

def enable_extension_keyboard_listener():
    send_message({"event": "IM DONE"})

def detect_actions_to_trigger(actions, repitions):
    # actionsToTrigger = find_sequence_with_markov(actions)
    # return actionsToTrigger
    pass

def trigger_actions(actions):
    time.sleep(2) # give a chance for the user to leave the popup and go back to the page
    disable_extension_keyboard_listener()
    # for action in actions:
        # time.sleep(0.5)
        # trigger_keyboard_command(action["keyParams"])
    enable_extension_keyboard_listener()

def main():
    actions = []
    msg = {}
    while True:
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
            actions.append(msg["action"])
            send_message("ack got the key=" + get_keyboard_string_from_key_params(actions[-1]["action"]["keyParams"]))
            continue
        if msg["event"] == "USER_PRESSED_STOP":
            actionsToTrigger = detect_actions_to_trigger(actions, msg["repitions"])
            trigger_actions(actionsToTrigger)
            actions = []
            continue

if __name__ == "__main__":
    main()
