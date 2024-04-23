import { Complexity, GetTypeFunction, graphweaverMetadata } from '..';

export interface adminUIFieldOptions {
	// This marks the field as a summary field in the admin UI.
	summaryField?: boolean;

	// This marks the field as hidden in the admin UI table.
	hideInTable?: boolean;

	// This marks the field as hidden in the admin UI filter bar.
	hideInFilterBar?: boolean;

	// This marks the field as hidden in the admin UI and will no longer be editable.
	readonly?: boolean;
}

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
	adminUIOptions?: adminUIFieldOptions;
	apiOptions?: {
		// This marks the field as read only in the API.
		readonly?: boolean;
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
