#!/usr/bin/env python3
import nativemessaging
import json
import os
import sys
import time
from subprocess import Popen
import patternfinder

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
    if sys.platform == "darwin":
        Popen([KEYBOARD_LISTENER_PATH, cmd])
    else:
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

def detect_actions_to_trigger(pattern_finder, repitions):
    res = pattern_finder.giveMePattern()
    return res["current"] + res["complete"] * (repitions - 1)

def trigger_actions(actions):
     # give a chance for the user to leave the popup and go back to the page
    send_message("starting in 2...")
    time.sleep(1) 
    send_message("1..")
    time.sleep(1) 
    send_message("0.")
    disable_extension_keyboard_listener()
    for action in actions:
        trigger_keyboard_command(action["action"]["keyParams"])
        time.sleep(0.5)
    enable_extension_keyboard_listener()

def main():
    pattern_finder = patternfinder.PatternFinder(send_message)
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
            res = pattern_finder.append(msg["action"])
            s = ""
            if res is not None:
                send_message({"event": "IM SURE", "sureness": res["sureness"]})
            continue
        if msg["event"] == "USER_PRESSED_STOP":
            actionsToTrigger = detect_actions_to_trigger(pattern_finder, int(msg["repitions"]))
            trigger_actions(actionsToTrigger)
            continue

if __name__ == "__main__":
    main()
