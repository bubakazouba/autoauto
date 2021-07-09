import unittest
from context import markov
import testutils

class TestMarkovMethods(unittest.TestCase):
    def markov_chain_test(self):
        cases = testutils.jsonLoad("markov_test_cases.json")
        for idx, case in enumerate(cases):
            chain = MarkovChain()
            for action1, action2 in zip(case[:-1], case[1:]):
                chain.add_transition(action1['key'], action2['key'])
            chain.resolve_transition_probabilities()
            chain.save("case_{}".format(idx))

if __name__ == '__main__':
    unittest.main()