import { GetTypeFunction } from '../types';
import { graphweaverMetadata } from '../metadata';

type RelationshipFieldOptions<D> = {
	relatedField?: keyof D & string;
	id?: (keyof D & (string | bigint)) | ((dataEntity: D) => string | number | bigint | undefined);
	nullable?: boolean;
	adminUIOptions?: {
		hideInTable?: boolean;
		hideInFilterBar?: boolean;
		hideInDetailForm?: boolean;
		readonly?: boolean;
		filterOptions?: Record<string, unknown>;
	};

	// Add custom field directives to this field
	directives?: Record<string, any>;
};

export function RelationshipField<RelatedType = unknown>(
	returnTypeFunc: GetTypeFunction,
	{ relatedField, id, nullable = false, ...remainingOptions }: RelationshipFieldOptions<RelatedType>
) {
	return (target: unknown, key: string) => {
		if (!id && !relatedField)
			throw new Error(
				`Implementation Error: You must specify either an ID or a related field and neither was specified.`
			);

		graphweaverMetadata.collectFieldInformation({
			name: key,
			getType: returnTypeFunc,
			nullable,
			target: target as new (...args: any[]) => unknown,
			relationshipInfo: {
				relatedField,
				id,
			},
			...remainingOptions,
		});
	};
}
