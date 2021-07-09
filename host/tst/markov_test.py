import unittest
from context import markov
import testutils

class TestStringMethods(unittest.TestCase):

    def test_markov_chain_0(self):
        cases = testutils.jsonLoad("markov_test_cases.json")
        for idx,case in enumerate(cases):
            chain = markov.MarkovChain()
            for action1, action2 in zip(case[:-1], case[1:]):
                chain.add_transition(action1['key'], action2['key'])
            chain.resolve_transition_probabilities()
            # chain.save("case_{}".format(idx))
            output = markov.get_cmds_from_action_list()
            self.assertEqual(output, testutils.jsonLoad("markov_expected.json")[idx])

if __name__ == '__main__':
    unittest.main()