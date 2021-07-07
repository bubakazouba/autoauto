#!/usr/bin/python3
import nativemessaging
import keyboard
import json
import time

def getKeyboardStringFromKeyParams(keyParams):
    s = keyParams["key"]
    if s[:5] == "Arrow":
        s = s[5:]
    if s[:4] == "Meta":
        return ""
    if keyParams["metaKey"]:
        s = "cmd+" + s
    return s

while True:
    message = nativemessaging.get_message()
    if message == "hello":
        nativemessaging.send_message(nativemessaging.encode_message("I'm alive"))
    else:
        keys = json.loads(message)
        for key in keys:
            time.sleep(0.5)
            s = getKeyboardStringFromKeyParams(key["action"]["keyParams"])
            if s == "":
                nativemessaging.send_message(nativemessaging.encode_message("skipping cuz empty"))
                continue
            keyboard.press_and_release(s)
            nativemessaging.send_message(nativemessaging.encode_message(s))
        nativemessaging.send_message(nativemessaging.encode_message("done"))