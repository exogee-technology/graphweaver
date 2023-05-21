import { GraphQLEntity, createBaseResolver, BackendProvider } from '@exogee/graphweaver';
import { Resolver, Field, ObjectType, ID } from 'type-graphql';

import { caps, createFieldOnClass, setNameOnClass, setClassReadOnly } from './util';

export interface ItemWithId {
	id: string;
	[key: string]: any;
}

export interface FieldOptions<DataEntity> {
	name: string;
	type: 'string' | 'float' | 'boolean';
	resolve?(data: DataEntity, fieldName: string): any;
	optional?: boolean;
	metadata?: Record<string, any>;
}

export interface ResolverOptions<Entity, DataEntity> {
	name: string;
	fields: Array<FieldOptions<DataEntity>>;
	provider: BackendProvider<DataEntity, Entity>;
	readOnly?: boolean;
}

export const createResolver = <Entity extends ItemWithId, DataEntity extends ItemWithId = Entity>({
	name,
	fields,
	provider,
	readOnly,
}: ResolverOptions<Entity, DataEntity>) => {
	const entityName = caps(name);

	// Create GraphQL Entity
	@ObjectType(entityName)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error @todo need to fix the type issue here
	class NewEntity extends GraphQLEntity<DataEntity> {
		public dataEntity!: DataEntity;

		@Field(() => ID)
		id!: string;
	}

	setNameOnClass(NewEntity, entityName);
	if (readOnly) setClassReadOnly(NewEntity);

	// Create fields on the class
	for (const {
		name: fieldName,
		type: fieldType,
		resolve: fieldResolve,
		optional: fieldOptional = true,
	} of fields) {
		createFieldOnClass(
			NewEntity,
			fieldName,
			fieldType,
			(dataEntity) => {
				if (fieldResolve) return fieldResolve(dataEntity, fieldName);
				return dataEntity[fieldName];
			},
			{ nullable: fieldOptional }
		);
	}

	// Create Base Resolver
	@Resolver(() => NewEntity)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error @todo need to fix the type issue here
	class NewResolver extends createBaseResolver<DataEntity, Entity>(NewEntity, provider) {}

	setNameOnClass(NewResolver, `${entityName}Resolver`);

	return { provider, entity: NewEntity, resolver: NewResolver };
};
