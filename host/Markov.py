import networkx as nx
import json

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
            node_successors = self.graph.successors(node)
            cumulative_weight = sum(
                [self.graph[node][successor]['weight'] for successor in node_successors])
            for successor in node_successors:
                self.graph[node][successor]['weight'] /= cumulative_weight

    def get_cycles_with_probabilities(self):
        return list(nx.simple_cycles(self.graph))

    def clear(self):
        self.graph.clear()


def markov_chain_unittest():
    cases = json.load(open("./host/markov_test_cases.json", 'r'))
    for case in cases:
        chain = MarkovChain()
        for action1, action2 in zip(case[:-1], case[1:]):
            chain.add_transition()
                
markov_chain_unittest()