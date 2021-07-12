import unittest
from context import patternfinder
import testutils

class TestStringMethods(unittest.TestCase):

    def util(self, casesFilePath, expectedFilePath):
        self.maxDiff = None
        actionsList = testutils.jsonLoad(casesFilePath)
        for i in range(len(actionsList)):
            actions = actionsList[i]
            expected_results = testutils.jsonLoad(expectedFilePath)[i]
            pattern_finder = patternfinder.PatternFinder(print)
            for j in range(len(actions)):
                action = actions[j]
                res = pattern_finder.append(action)
                if res is None:
                    self.assertEqual(None, expected_results[j])
                else:
                    if expected_results[j] is None:
                        self.assertEqual(True, False)
                    self.assertEqual(res["sureness"], expected_results[j]["sureness"])
                    self.assertEqual(pattern_finder.giveMePattern(), expected_results[j]["giveMePattern"])
    
    def test_patternfinder_perfect(self):
        self.util("patternfinder_perfect_test_cases.json", "patternfinder_perfect_expected.json")

    def test_patternfinder_fuzzy(self):
        self.util("patternfinder_fuzzy_test_cases.json", "patternfinder_fuzzy_expected.json")
if __name__ == '__main__':
    unittest.main()