import { GetTypeFunction } from '..';
import { graphweaverMetadata } from '../metadata';

type RelationshipFieldOptions<D> = {
	relatedField?: keyof D & string;
	id?: (keyof D & (string | number)) | ((dataEntity: D) => string | number | undefined);
	nullable?: boolean;
	adminUIOptions?: {
		hideInTable?: boolean;
		hideInFilterBar?: boolean;
		readonly?: boolean;
	};
};

export function RelationshipField<RelatedType = unknown>(
	returnTypeFunc: GetTypeFunction,
	{ relatedField, id, nullable = false, adminUIOptions }: RelationshipFieldOptions<RelatedType>
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
			adminUIOptions,
		});
	};
}
