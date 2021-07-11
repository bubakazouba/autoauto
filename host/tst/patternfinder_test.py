import unittest
from context import patternfinder
import testutils

class TestStringMethods(unittest.TestCase):

    def test_patternfinder_perfect(self):
        self.maxDiff = None
        actionsList = testutils.jsonLoad("patternfinder_perfect_test_cases.json")
        for i in range(len(actionsList)):
            actions = actionsList[i]
            expected_results = testutils.jsonLoad("patternfinder_perfect_expected.json")[i]
            pattern_finder = patternfinder.PatternFinder(print)
            for j in range(len(actions)):
                action = actions[j]
                res = pattern_finder.append(action)
                if res is None:
                    self.assertEqual(None, expected_results[j])
                else:
                    self.assertEqual(res["sureness"], expected_results[j]["sureness"])
                    self.assertEqual(pattern_finder.giveMePattern(), expected_results[j]["giveMePattern"])

if __name__ == '__main__':
    unittest.main()