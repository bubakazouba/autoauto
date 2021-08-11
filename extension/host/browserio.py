import nativemessaging

def send_message(s):
    nativemessaging.send_message(nativemessaging.encode_message(s))

def get_message():
    return nativemessaging.get_message()