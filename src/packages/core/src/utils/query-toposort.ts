/**
 * Topological sorting function
 *
 * @param {Array} edges - Array of edges [fromNode, toNode]
 * @returns {Array} - Sorted array of nodes
 */

type Edge<T> = [T, T];

export const toposort = <T>(nodes: T[], edges: Edge<T>[]): T[] => {
	let cursor = nodes.length;
	const sorted = new Array<T>(cursor);
	const visited: Record<number, boolean> = {};
	let i = cursor;

	// Better data structures make algorithm much faster.
	const outgoingEdges = makeOutgoingEdges(edges);
	const nodesHash = makeNodesHash(nodes);

	// check for unknown nodes
	edges.forEach((edge: Edge<T>) => {
		if (!nodesHash.has(edge[0]) || !nodesHash.has(edge[1])) {
			throw new Error('Unknown node. There is an unknown node in the supplied edges.');
		}
	});

	while (i--) {
		if (!visited[i]) visit(nodes[i], i, new Set<T>());
	}

	return sorted;

	function visit(node: T, i: number, predecessors: Set<T>): void {
		if (predecessors.has(node)) {
			let nodeRep: string;
			try {
				nodeRep = ', node was:' + JSON.stringify(node);
			} catch (e) {
				nodeRep = '';
			}
			throw new Error('Cyclic dependency' + nodeRep);
		}

		if (!nodesHash.has(node)) {
			throw new Error(
				'Found unknown node. Make sure to provided all involved nodes. Unknown node: ' +
					JSON.stringify(node)
			);
		}

		if (visited[i]) return;
		visited[i] = true;

		const outgoing = outgoingEdges.get(node) || new Set<T>();
		const outgoingArray = Array.from(outgoing);

		if ((i = outgoingArray.length)) {
			predecessors.add(node);
			do {
				const child = outgoingArray[--i];
				visit(child, nodesHash.get(child)!, predecessors);
			} while (i);
			predecessors.delete(node);
		}

		sorted[--cursor] = node;
	}
};

const uniqueNodes = <T>(arr: Edge<T>[]): T[] => {
	const res = new Set<T>();
	for (let i = 0, len = arr.length; i < len; i++) {
		const edge = arr[i];
		res.add(edge[0]);
		res.add(edge[1]);
	}
	return Array.from(res);
};

const makeOutgoingEdges = <T>(arr: Edge<T>[]): Map<T, Set<T>> => {
	const edges = new Map<T, Set<T>>();
	for (let i = 0, len = arr.length; i < len; i++) {
		const edge = arr[i];
		if (!edges.has(edge[0])) edges.set(edge[0], new Set<T>());
		if (!edges.has(edge[1])) edges.set(edge[1], new Set<T>());
		edges.get(edge[0])!.add(edge[1]);
	}
	return edges;
};

const makeNodesHash = <T>(arr: T[]): Map<T, number> => {
	const res = new Map<T, number>();
	for (let i = 0, len = arr.length; i < len; i++) {
		res.set(arr[i], i);
	}
	return res;
};

export default <T>(edges: Edge<T>[]): T[] => {
	return toposort(uniqueNodes(edges), edges);
};
