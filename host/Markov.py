import networkx as nx
import json
import numpy as np
from pprint import pprint as pp 
from networkx.drawing.nx_agraph import to_agraph

class MarkovChain():
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_transition(self, source_state, destination_state):
        if not self.graph.has_edge(source_state, destination_state):
            self.graph.add_edge(source_state, destination_state, weight=1)
        else:
            self.graph[source_state][destination_state]['weight'] += 1

    def resolve_transition_probabilities(self):
        for node in self.graph.nodes():
            node_successors = list(self.graph.successors(node))
            cumulative_weight = sum(
                [self.graph[node][successor]['weight'] for successor in node_successors])
            for successor in node_successors:
                self.graph[node][successor]['weight'] /= cumulative_weight

    def save(self, name):
        for src, dst in self.graph.edges():
            self.graph[src][dst]['label'] = '{:.2f}'.format(self.graph[src][dst]['weight'])
        A = to_agraph(self.graph)
        A.layout('circo')
        A.draw('{}.jpeg'.format(name))

    def get_cycles(self):
        cycles = list(nx.simple_cycles(self.graph))
        cycles_with_probabilities = []
        for cycle in cycles:
            cycle.append(cycle[0])
            cycle_transition_probabilities = []
            for state1, state2 in zip(cycle[:-1], cycle[1:]):
                if self.graph.has_edge(state1, state2): # sanity check
                    cycle_transition_probabilities.append(self.graph[state1][state2]['weight'])
                else:
                    cycle_transition_probabilities.append(0)
                    break
            cycle_probability = np.prod(cycle_transition_probabilities)
            cycles_with_probabilities.append((cycle[:-1], cycle_probability))
        return cycles_with_probabilities

    def clear(self):
        self.graph.clear()

    def order_cycles_by_first_action_occurence(self, cycles, cmd_list):
        # TODO
        pass
    
def get_cmds_from_action_list():
    # TODO
    pass
    
def markov_chain_unittest():
    cases = json.load(open("./host/markov_test_cases.json", 'r'))
    for idx, case in enumerate(cases):
        chain = MarkovChain()
        for action1, action2 in zip(case[:-1], case[1:]):
            chain.add_transition(action1['key'], action2['key'])
        chain.resolve_transition_probabilities()
        chain.save("case_{}".format(idx))


markov_chain_unittest()
