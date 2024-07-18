export type SpanTree = Omit<Span, '__typename'> & {
	children: SpanTree[];
	childrenCount: number;
};

export type Span = {
	id: string;
	spanId: string;
	parentId?: string | null; // Optional and nullable
	traceId: string;
	name: string;
	duration: string;
	timestamp: string;
	attributes: Record<string, unknown>;
};

const applyChildrenCountsAndGroup = (node: SpanTree): SpanTree => {
	if (node.children.length === 0) return { ...node, childrenCount: 0 };

	let count = 0;

	const group = new Map<string, SpanTree[]>();

	for (const child of node.children) {
		const childWithCount = applyChildrenCountsAndGroup(child);

		// Group children by name
		group.set(childWithCount.name, [...(group.get(childWithCount.name) ?? []), childWithCount]);
		count += childWithCount.childrenCount;
	}

	const children = [];
	for (const [_name, childNodes] of group) {
		if (childNodes.length === 1) {
			children.push(childNodes[0]);
		} else {
			// create a new span with the same id as the first child
			const newSpan = {
				...childNodes[0],
				// Calculate the total duration of the group
				duration: String(
					Number(childNodes.at(-1)?.timestamp) +
						Number(childNodes.at(-1)?.duration) -
						Number(childNodes[0].timestamp)
				),
				children: childNodes,
				childrenCount: childNodes.reduce((acc, child) => acc + child.childrenCount, 0),
			};

			children.push(newSpan);
		}
	}

	return {
		...node,
		children,
		childrenCount: count + node.children.length,
	};
};

export const createTreeFromTrace = (spans: Span[]): SpanTree => {
	let rootNode: SpanTree | undefined = undefined;
	const lookup = new Map<string, SpanTree>();

	for (const span of spans) {
		// Add the span to the lookup
		const existingSpan = lookup.get(span.spanId);
		const spanWithChildren = {
			...span,
			children: [...(existingSpan ? existingSpan.children : [])],
		} as SpanTree;
		lookup.set(span.spanId, spanWithChildren);

		// If this span has a parent, add this span as a child
		if (span.parentId) {
			const parentSpan = lookup.get(span.parentId);
			if (parentSpan) {
				parentSpan.children.push(spanWithChildren);
			} else {
				lookup.set(span.parentId, { children: [spanWithChildren] } as SpanTree);
			}
		} else {
			rootNode = spanWithChildren;
		}
	}

	if (!rootNode) {
		throw new Error('No root node found');
	}

	return applyChildrenCountsAndGroup(rootNode);
};
