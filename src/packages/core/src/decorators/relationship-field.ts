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

export function RelationshipField<G = unknown, D = unknown>(
	returnTypeFunc: GetTypeFunction,
	{ relatedField, id, nullable = false, adminUIOptions }: RelationshipFieldOptions<D>
) {
	return (target: G, key: string) => {
		if (!id && !relatedField)
			throw new Error(
				`Implementation Error: You must specify either an ID or a related field and neither was specified.`
			);

		graphweaverMetadata.collectFieldInformation({
			name: key,
			getType: returnTypeFunc,
			nullable,
			target: target as { new (...args: any[]): G },
			relationshipInfo: {
				relatedField,
				id,
			},
			adminUIOptions,
		});
	};
}
