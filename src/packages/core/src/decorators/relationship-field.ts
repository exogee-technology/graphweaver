import { BaseDataEntity, GraphQLEntity } from '..';
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

interface ClassType<T extends GraphQLEntity<BaseDataEntity>> {
	new (...args: any[]): T;
}
interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}
type TypeValue = ClassType<GraphQLEntity<BaseDataEntity>>;
type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue>;
type ReturnTypeFunc = () => ReturnTypeFuncValue;

export function RelationshipField<
	G extends GraphQLEntity<D> = any,
	D extends BaseDataEntity = G['dataEntity'],
>(
	returnTypeFunc: ReturnTypeFunc,
	{ relatedField, id, nullable = false, adminUIOptions }: RelationshipFieldOptions<D>
) {
	return (target: any, key: string) => {
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
