#!/home/sultan/anaconda3/bin/python
import nativemessaging
import keyboard
import json
import time
import tail

def getKeyboardStringFromKeyParams(keyParams):
    s = keyParams["key"]
    if s[:5] == "Arrow":
        s = s[5:]
    if s[:4] == "Meta":
        return ""
    if keyParams["metaKey"]:
        s = "cmd+" + s
    return s

proxy_file_watcher = tail.Tail('/tmp/proxy_file.log')

def process_message(message):
    print(message)

proxy_file_watcher.register_callback(process_message)

proxy_file_watcher.follow(s=0.2)






    
#    keys = json.loads(message)
#    for key in keys:
#        time.sleep(0.5)
#        s = getKeyboardStringFromKeyParams(key["action"]["keyParams"])
#        keyboard.press_and_release(s)
