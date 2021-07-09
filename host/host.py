#!/home/sultan/anaconda3/bin/python
import nativemessaging
import json
import time


def getKeyboardStringFromKeyParams(keyParams):
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


def send_keyboard_command(cmd):
    proxy_file.write(cmd + "\n")
    proxy_file.flush()


proxy_file = open("/tmp/proxy_file.log", 'a')


def disable_extension_keyboard_listener():
    nativemessaging.send_message(nativemessaging.encode_message("IM WORKING"))


def enable_extension_keyboard_listener():
    nativemessaging.send_message(nativemessaging.encode_message("IM DONE"))


def main():
    while True:
        message = nativemessaging.get_message()
        if message == "hello":
            nativemessaging.send_message(
                nativemessaging.encode_message("I'm alive"))
        else:
            keys = json.loads(message)
            for key in keys:
                time.sleep(0.5)
                s = getKeyboardStringFromKeyParams(key["action"]["keyParams"])
                if s == "":
                    nativemessaging.send_message(
                        nativemessaging.encode_message("skipping cuz empty"))
                    continue
                send_keyboard_command(s)
                nativemessaging.send_message(nativemessaging.encode_message(s))
            nativemessaging.send_message(
                nativemessaging.encode_message("done"))


if __name__ == "__main__":
    main()
