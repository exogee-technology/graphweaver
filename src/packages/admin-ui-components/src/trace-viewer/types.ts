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
};

export type Trace = {
	traces: Span[];
};
