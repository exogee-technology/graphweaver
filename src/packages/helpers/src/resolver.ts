import { GraphQLEntity, createBaseResolver, BackendProvider } from '@exogee/graphweaver';
import { Resolver as ResolverDecorator, Field, ObjectType, ID } from 'type-graphql';

import { caps, createFieldOnClass, setNameOnClass, setClassReadOnly } from './util';

interface Item {
	id: string;
	[key: string]: string | number | boolean;
}

export interface FieldOptions<TEntity> {
	name: string;
	type: 'string' | 'float' | 'boolean';
	resolve?(data: TEntity, fieldName: string): any;
	optional?: boolean;
	metadata?: Record<string, any>;
}

export interface ResolverOptions<TEntity extends Item> {
	name: string;
	fields: Array<FieldOptions<TEntity>>;
	provider: BackendProvider<TEntity, TEntity>;
	readOnly?: boolean;
}

export const createResolver = <TEntity extends Item>({
	name,
	fields,
	provider,
	readOnly,
}: ResolverOptions<TEntity>) => {
	const entityName = caps(name);

	// Create GraphQL Entity
	@ObjectType(entityName)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error @todo need to fix the type issue heree
	class Entity extends GraphQLEntity<TEntity> {
		public dataEntity!: TEntity;

		@Field(() => ID)
		id!: string;
	}

	setNameOnClass(Entity, entityName);
	if (readOnly) setClassReadOnly(Entity);

	// Create fields on the class
	for (const {
		name: fieldName,
		type: fieldType,
		resolve: fieldResolve,
		optional: fieldOptional = true,
	} of fields) {
		createFieldOnClass(
			Entity,
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
	@ResolverDecorator(() => Entity)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error @todo need to fix the type issue here
	class Resolver extends createBaseResolver<Entity, TEntity>(Entity, provider) {}

	setNameOnClass(Resolver, `${entityName}Resolver`);

	return { provider, entity: Entity, resolver: Resolver };
};
