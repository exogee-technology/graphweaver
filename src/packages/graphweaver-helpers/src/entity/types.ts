export interface ItemWithId {
	id: string;
	[key: string]: any;
}

export interface FieldOptions<DataEntity> {
	name: string;
	type: 'id' | 'string' | 'float' | 'boolean' | 'json' | (() => any);
	resolve?(data: DataEntity): any;
	optional?: boolean;
	summary?: boolean;
	metadata?: Record<string, any>;
	excludeFromInputTypes?: boolean;
	excludeFromFilterType?: boolean;
}
