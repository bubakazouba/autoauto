import os
import json

def getFilePath(fileName):
    relativeFilePath = "./testdata/" + fileName
    scriptDir = os.path.dirname(__file__)
    return os.path.join(scriptDir, relativeFilePath)

def jsonLoad(fileName):
    file = open(getFilePath(fileName), "r")
    return byteify(json.load(file))
