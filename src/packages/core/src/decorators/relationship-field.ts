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

interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}
type GraphQLEntityType<G> = { new (...args: any[]): G };
type ReturnTypeFuncValue<G> = GraphQLEntityType<G> | RecursiveArray<GraphQLEntityType<G>>;
type ReturnTypeFunc<G> = () => ReturnTypeFuncValue<G>;

export function RelationshipField<G = unknown, D = unknown>(
	returnTypeFunc: ReturnTypeFunc<G>,
	{ relatedField, id, nullable = false, adminUIOptions }: RelationshipFieldOptions<D>
) {
	return (target: GraphQLEntityType<G>, key: string) => {
		if (!id && !relatedField)
			throw new Error(
				`Implementation Error: You must specify either an ID or a related field and neither was specified.`
			);

		graphweaverMetadata.collectFieldInformation({
			name: key,
			getType: returnTypeFunc,
			nullable,
			target,
			relationshipInfo: {
				relatedField,
				id,
			},
			adminUIOptions,
		});
	};
}
