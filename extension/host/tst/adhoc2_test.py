import unittest
from context import adhoc2
import testutils

class TestStringMethods(unittest.TestCase):

    def test_markov_perfect(self):
        actionsList = testutils.jsonLoad("markov_perfect_test_cases.json")
        for idx, actions in enumerate(actionsList):
            output = adhoc2.detect_repition(actions)
            self.assertEqual(output["pattern"], testutils.jsonLoad("markov_perfect_expected.json")[idx])
            self.assertEqual(output["error"], 0)

    def test_markov_fuzzy(self):
        actionsList = testutils.jsonLoad("markov_fuzzy_test_cases.json")
        output = adhoc2.detect_repition(actionsList[0])
        self.assertEqual(output["pattern"], testutils.jsonLoad("markov_fuzzy_expected.json")[0])
        self.assertEqual(output["error"], 2)

        output = adhoc2.detect_repition(actionsList[1])
        self.assertEqual(output["pattern"], testutils.jsonLoad("markov_fuzzy_expected.json")[1])
        self.assertEqual(output["error"], 1)

if __name__ == '__main__':
    unittest.main()