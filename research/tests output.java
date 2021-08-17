import unittest
from context import patternfinder
import testutils
import copy
import json

class TestStringMethods(unittest.TestCase):

    def utilDir(self, directoryPath):
        self.util(directoryPath+"/test.json", directoryPath+"/expected.json")

    def util(self, casesFilePath, expectedFilePath):
        self.maxDiff = None
        actionsList = testutils.jsonLoad(casesFilePath)
        for i in range(len(actionsList)):
            actions = actionsList[i]
            expected_results = testutils.jsonLoad(expectedFilePath)[i]
            pattern_finder = patternfinder.PatternFinder(lambda i: i)
            for j in range(len(actions)):
                action = actions[j]
                res = pattern_finder.append(action)
                if res is None:
                    print("null")
                    # self.assertEqual(None, expected_results[j])
                else:
                    pattern = pattern_finder.giveMePattern()
                    pattern = _sanitizePatternInPattern(pattern)
                    print(json.dumps({"sureness": res["sureness"], "giveMePattern": pattern}))
                    # if expected_results[j] is None:
                    #     self.assertEqual(True, False)
                    #     continue
                    # self.assertEqual(res["sureness"], expected_results[j]["sureness"])
                    # self.assertEqual(pattern, expected_results[j]["giveMePattern"])
