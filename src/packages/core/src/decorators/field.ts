import { Complexity, GetTypeFunction, graphweaverMetadata } from '..';

export interface FieldOptions {
	description?: string;
	deprecationReason?: string;
	complexity?: Complexity;
	defaultValue?: any;
	nullable?: boolean | 'items' | 'itemsAndList';
	excludeFromFilterType?: boolean;
	primaryKeyField?: boolean;

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

	// This can be used by any plugin to store additional information
	// namespace your key to avoid conflicts
	// See the `@MediaField` decorator for an example
	additionalInformation?: Record<string, unknown>;

	// Add custom field directives to this field
	directives?: Record<string, any>;
}

export function Field(getType: GetTypeFunction, options?: FieldOptions) {
	// Fields can be used on both Entities and InputObjects. When used on input objects we can't actually assert they're
	// on an entity, hence why Field's target is typed as `any`. It's actually G | any, but that's the same as just any.
	return (target: any, fieldName: string) => {
		graphweaverMetadata.collectFieldInformation({
			getType,
			target,
			name: fieldName,
			...options,
		});
	};
}
