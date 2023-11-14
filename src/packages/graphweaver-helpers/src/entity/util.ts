import { ObjectType, Float, Field, ID } from 'type-graphql';
import {
	ReadOnly,
	RelationshipField,
	BaseDataEntity,
	SummaryField,
	ExcludeFromInputTypes,
	ExcludeFromFilterType,
	GraphQLEntity,
} from '@exogee/graphweaver';
import { FieldOptions } from './types';

export const caps = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const setNameOnEntity = (target: any, name: string) =>
	Object.defineProperty(target, 'name', { value: name });

export const createFieldOnEntity = <DataEntity = any>(
	entity: any,
	{
		name,
		type,
		resolve,
		optional = true,
		summary = false,
		excludeFromInputTypes = false,
		excludeFromFilterType = true,
	}: FieldOptions<DataEntity>,
	fieldDecoratorOptions?: any
) => {
	// Create property on entity
	Object.defineProperty(entity.prototype, name, {
		value() {
			return resolve(this.dataEntity);
		},
		configurable: true,
		writable: true,
	});

	// Apply field decorator
	applyDecoratorToField(
		entity,
		name,
		Field(typeFunctionForType(type), {
			nullable: optional,
			...fieldDecoratorOptions,
		})
	);

	if (summary) applyDecoratorToField(entity, name, SummaryField());
	if (excludeFromInputTypes) applyDecoratorToField(entity, name, ExcludeFromInputTypes());
	if (excludeFromFilterType) applyDecoratorToField(entity, name, ExcludeFromFilterType());
};

export const createRelationshipFieldOnEntity = <D extends BaseDataEntity>(
	entity: any,
	fromDataEntity: (dataEntity: D) => string,
	toFieldName: string,
	relatedEntity: any
) => {
	Object.defineProperty(entity.prototype, toFieldName, {
		value: undefined,
		configurable: true,
		writable: true,
	});

	RelationshipField(() => relatedEntity, { id: fromDataEntity })(entity.prototype, toFieldName);
};

export const setFieldAsSummaryField = (target: any, name: string) =>
	applyDecoratorToField(target, name, SummaryField());

export const setFieldAsExcludeFromInputTypes = (target: any, name: string) =>
	applyDecoratorToField(target, name, ExcludeFromInputTypes());

export const setFieldAsExcludeFromFilterType = (target: any, name: string) =>
	applyDecoratorToField(target, name, ExcludeFromFilterType());

// @todo type Decorator better
export const applyDecoratorToField = (
	target: any,
	fieldName: string,
	Decorator: (target: any, fieldName: string, propertyDescriptor?: any) => any
) =>
	Decorator(
		target.prototype,
		fieldName,
		Object.getOwnPropertyDescriptor(target.prototype, fieldName)
	);

export const setEntityAsReadOnly = (target: any) => applyDecoratorToEntity(target, ReadOnly());

export const applyDecoratorToEntity = (target: any, Decorator: (target: any) => any) =>
	Decorator(target.prototype);

// @todo add arrays
export const typeFunctionForType = <DataEntity = any>(
	type: FieldOptions<DataEntity>['type']
): (() => any) => {
	if (typeof type === 'function') return type;
	switch (type) {
		case 'string':
			return () => String;
		case 'float':
			return () => Float;
		case 'boolean':
			return () => Boolean;
		case 'id':
			return () => ID;
	}
};

export const createEmptyEntity = <DataEntity>(entityName: string): any => {
	// Create GraphQL Entity
	@ObjectType(entityName)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error DataEntity currently requires two methods to satisfy interface
	class NewEntity extends GraphQLEntity<DataEntity> {
		public dataEntity!: DataEntity;

		static link(
			fromDataEntity: (dataEntity: DataEntity) => string,
			toFieldName: string,
			entity: any
		) {
			createRelationshipFieldOnEntity(
				this,
				fromDataEntity as (dataEntity: BaseDataEntity) => string,
				toFieldName,
				entity
			);
			return this;
		}
	}

	setNameOnEntity(NewEntity, entityName);

	return NewEntity;
};
