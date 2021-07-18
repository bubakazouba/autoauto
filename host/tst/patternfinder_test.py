import unittest
from context import patternfinder
import testutils

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
                    self.assertEqual(None, expected_results[j])
                else:
                    if expected_results[j] is None:
                        self.assertEqual(True, False)
                        continue
                    self.assertEqual(res["sureness"], expected_results[j]["sureness"])
                    self.assertEqual(pattern_finder.giveMePattern(), expected_results[j]["giveMePattern"])

    def test_patternfinder_perfect(self):
        self.utilDir("patternfinder/perfect_keystrokes")

    def test_patternfinder_fuzzy(self):
        self.utilDir("patternfinder/fuzzy_keystrokes")

    def test_patternfinder_perfect_list_incrementing_with_stuff_before(self):
        self.utilDir("patternfinder/perfect_list_incrementing")

    def test_patternfinder_perfect_list_no_incrementing(self):
        self.utilDir("patternfinder/perfect_list_no_incrementing")

if __name__ == '__main__':
    unittest.main()