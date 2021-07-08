#!/home/sultan/anaconda3/bin/python
import nativemessaging

with open("/tmp/proxy_file.log", 'a') as proxy_file:
    while True:
        message = nativemessaging.get_message()
        proxy_file.write(message)
        proxy_file.write("\n")
        proxy_file.flush()

