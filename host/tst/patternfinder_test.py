import unittest
from context import patternfinder
import testutils
import copy

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
                    print("None")
                    # self.assertEqual(None, expected_results[j])
                else:
                    pattern = pattern_finder.giveMePattern()
                    pattern = _sanitizePatternInPattern(pattern)
                    print({"sureness": res["sureness"], "giveMePattern": pattern})
                    # if expected_results[j] is None:
                    #     self.assertEqual(True, False)
                    #     continue
                    # self.assertEqual(res["sureness"], expected_results[j]["sureness"])
                    # self.assertEqual(pattern, expected_results[j]["giveMePattern"])

    # def test_patternfinder_perfect(self):
    #     self.utilDir("patternfinder/perfect_keystrokes")

    # def test_patternfinder_fuzzy(self):
    #     self.utilDir("patternfinder/fuzzy_keystrokes")

    # def test_patternfinder_perfect_list_incrementing_with_stuff_before(self):
    #     self.utilDir("patternfinder/perfect_list_incrementing")

    def test_patternfinder_perfect_list_no_incrementing(self):
        self.utilDir("patternfinder/perfect_list_no_incrementing")

def _sanitizePatternInPattern(pattern):
    pattern = copy.deepcopy(pattern)
    for action in pattern["current"]:
        if "pattern" in action["action"] and type(action["action"]["pattern"]) == tuple:
            action["action"]["pattern"] = action["action"]["pattern"][0]
    for action in pattern["complete"]:
        if "pattern" in action["action"] and type(action["action"]["pattern"]) == tuple:
            action["action"]["pattern"] = action["action"]["pattern"][0]
    return pattern

if __name__ == '__main__':
    unittest.main()
