#!/usr/bin/env python3
import nativemessaging
import json
import time

proxy_file = open("/tmp/proxy_file.log", 'a')

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
    proxy_file.write(cmd + "\n")
    proxy_file.flush()

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
            send_message("dumbo i cant parse ur 'json'")
            continue

        if "event" not in msg:
            send_message("dumbass send a valid msg")
            continue

        if msg["event"] = "heart_beat":
            send_message("I'm alive")
            continue
        if msg["event"] == "ACTION":
            actions.append(msg["action"])
            send_message("ack got the key")
            continue
        if msg["event"] == "USER_PRESSED_STOP":
            actionsToTrigger = detect_actions_to_trigger(actions, msg["repitions"])
            trigger_actions(actionsToTrigger)
            actions = []
            continue

if __name__ == "__main__":
    main()
