import os
import json

def getFilePath(fileName):
    relativeFilePath = "./testdata/" + fileName
    scriptDir = os.path.dirname(__file__)
    return os.path.join(scriptDir, relativeFilePath)

def jsonLoad(fileName):
    file = open(getFilePath(fileName), "r")
    ret = byteify(json.load(file))
    file.close()
    return ret

# Takes dict possibly containing unicode strings (u"") and converting them to str objects ("")
# Example: {u"hello": u"bye"} -> {"hello": "bye"}
def byteify(data, ignore_dicts = False):
    if isinstance(data, str):
        return data

    # if this is a list of values, return list of byteified values
    if isinstance(data, list):
        return [ byteify(item, ignore_dicts=False) for item in data ]
    # if this is a dictionary, return dictionary of byteified keys and values
    # but only if we haven't already byteified it
    if isinstance(data, dict) and not ignore_dicts:
        return {
            byteify(key, ignore_dicts=True): byteify(value, ignore_dicts=True)
            for key, value in data.items() # changed to .items() for python 2.7/3
        }

    # python 3 compatible duck-typing
    # if this is a unicode string, return its string representation
    if str(type(data)) == "<type 'unicode'>":
        return data.encode('utf-8')

    # if it's anything else, return it in its original form
    return data