export type SpanTree = Omit<Span, '__typename'> & {
	children: SpanTree[];
	childrenCount: number;
};

export type Span = {
	id: string;
	parentId?: string | null; // Optional and nullable
	traceId: string;
	name: string;
	duration: string;
	timestamp: string;
	attributes: Record<string, unknown>;
};

export type Trace = {
	traces: Span[];
};

const applyChildrenCounts = (node: SpanTree): SpanTree => {
	if (node.children.length === 0) return { ...node, childrenCount: 0 };

	let count = 0;
	const children: SpanTree[] = [];
	for (const child of node.children) {
		const childWithCount = applyChildrenCounts(child);
		children.push(childWithCount);
		count += childWithCount.childrenCount;
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
		const existingSpan = lookup.get(span.id);
		const spanWithChildren: SpanTree = {
			...span,
			children: [...(existingSpan ? existingSpan.children : [])],
		} as SpanTree;
		lookup.set(span.id, spanWithChildren);

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

	return applyChildrenCounts(rootNode);
};
