import { Complexity, GetTypeFunction, graphweaverMetadata } from '..';

export interface FieldOptions {
	description?: string;
	deprecationReason?: string;
	complexity?: Complexity;
	defaultValue?: any;
	nullable?: boolean | 'items' | 'itemsAndList';
	excludeFromFilterType?: boolean;
	// This marks the field as read only in both the API and the admin UI.
	// This will supersede any other read only settings.
	readonly?: boolean;
	adminUIOptions?: {
		hideInTable?: boolean;
		hideInFilterBar?: boolean;
		readonly?: boolean;
		summaryField?: boolean;
	};
	apiOptions?: {
		// This marks the field as read only in the API.
		excludeFromBuiltInWriteOperations?: boolean;
	};
}

export function Field(getType: GetTypeFunction, options?: FieldOptions) {
	return <G>(target: G, fieldName: string) => {
		graphweaverMetadata.collectFieldInformation({
			getType,
			target,
			name: fieldName,
			...options,
		});
	};
}
