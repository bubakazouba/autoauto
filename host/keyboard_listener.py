#!/home/sultan/anaconda3/bin/python
import keyboard
import tail

proxy_file_watcher = tail.Tail('/tmp/proxy_file.log')

def process_cmd(cmd):
    print(cmd)
    if cmd is not None and len(cmd) > 0:
        keyboard.press_and_release(cmd)

proxy_file_watcher.register_callback(process_cmd)

proxy_file_watcher.follow(s=0.2)






    
