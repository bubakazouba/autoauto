import unittest
from context import DPBayesian
import testutils
from pprint import pprint as pp

class TestStringMethods(unittest.TestCase):

    def test_markov_dpbayesian_0(self):
        cases = testutils.jsonLoad("markov_fuzzy_test_cases.json")
        for idx,case in enumerate(cases):
            pattern_finder = DPBayesian.BayesianPatternFinder()
            for action in case:
                pattern_finder.append(action['key'])
            # pp(pattern_finder.candidate_cycles)
            pattern_finder._getCycleMetrics()
            patterns = pattern_finder.giveMePattern()
            with open('./log', 'a') as log:
                for pattern, metric in patterns:
                    print('------------------------------', file=log)
                    print(pattern, file=log)
                    print(metric, file=log)
            if idx == 0:
                break

if __name__ == '__main__':
    unittest.main()