import { Complexity, GetTypeFunction } from '..';
import { graphweaverMetadata } from '..';

export interface FieldOptions {
	description?: string;
	deprecationReason?: string;
	complexity?: Complexity;
	defaultValue?: any;
	nullable?: boolean | 'items' | 'itemsAndList';
	excludeFromFilterType?: boolean;
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
