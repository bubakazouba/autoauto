def get_all_possible_start_indices_for_k(n ,k):
	l = []
	for i in range(n-k): # all possible k
		for j in range(i+k, n-k):
			l.append((i,j))
	return l

def array_equal(actions1, actions2):
	return actions1 == actions2

def detect_repition(actions):
	n = len(actions)
	# for k in range(int(n/2),-1,-1): # max k is n/2
	for k in range(3, int(n/2)):
		print("k=", k)
		# if k ==2:
		# 	break
		all_possible_start_indices_for_k = get_all_possible_start_indices_for_k(n, k)
		print(all_possible_start_indices_for_k)
		for ij in all_possible_start_indices_for_k:
			i = ij[0]
			j = ij[1]
			if array_equal(actions[i: i+k], actions[j: j+k]):
				print("chose i,j=", i,j)
				print("going to return", [x["key"] for x in actions[i:j]])
				return actions[i:j]
	return []