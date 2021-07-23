import unittest
from context import adhoc
import testutils

class TestStringMethods(unittest.TestCase):

    def test_markov_chain_0(self):
        actionsList = testutils.jsonLoad("markov_perfect_test_cases.json")
        for idx, actions in enumerate(actionsList):
            output = adhoc.detect_repition(actions)
            self.assertEqual(output, testutils.jsonLoad("markov_perfect_expected.json")[idx])

if __name__ == '__main__':
    unittest.main()