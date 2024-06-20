export type RenderTree = Omit<Span, '__typename'> & {
	children: RenderTree[];
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

export const createTreeFromTrace = (spanArray: Span[]): RenderTree[] => {
	const treeData: RenderTree[] = [];
	const lookup: { [key: string]: RenderTree } = {};

	spanArray.forEach((span) => {
		lookup[span.id] = {
			...span,
			children: [],
		};
	});

	spanArray.forEach((span) => {
		if (span.parentId) {
			lookup[span.parentId]?.children?.push(lookup[span.id]);
		} else {
			treeData.push(lookup[span.id]);
		}
	});

	return treeData;
};
