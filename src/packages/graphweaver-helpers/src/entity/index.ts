import { GraphQLJSON } from 'graphql-type-json';

import { caps, createEmptyEntity, createFieldOnEntity, setEntityAsReadOnly } from './util';

export {
	createFieldOnEntity,
	createRelationshipFieldOnEntity,
	setEntityAsReadOnly,
	applyDecoratorToEntity,
	setFieldAsSummaryField,
	setFieldAsExcludeFromInputTypes,
	setFieldAsExcludeFromFilterType,
	applyDecoratorToField,
} from './util';

import type { FieldOptions } from './types';
export type { ItemWithId, FieldOptions } from './types';

export interface CreateEntityOptions<DataEntity> {
	fields?: Array<FieldOptions<DataEntity>>;
	readOnly?: boolean;
	templateEntity?: any /* Use the provided entity as a template rather than creating a new one from scratch */;
	addRawField?: boolean /*Add a `raw` field that returns a GraphQLJSON of the raw data entity */;
}

export const createEntity = <DataEntity>(
	entityName: string,
	options?: CreateEntityOptions<DataEntity>
) => {
	entityName = caps(entityName);

	// Create entity base or use the provided template
	const NewEntity = options?.templateEntity ?? createEmptyEntity<DataEntity>(entityName);

	if (options?.readOnly) setEntityAsReadOnly(NewEntity);

	if (Array.isArray(options?.fields)) {
		// Create fields on the class
		for (const { resolve, ...field } of options.fields) {
			createFieldOnEntity(NewEntity, {
				...field,
				...(!resolve ? { resolve: (dataEntity) => dataEntity[field.name] } : { resolve }),
			});
		}
	}

	if (options?.addRawField)
		createFieldOnEntity(NewEntity, {
			name: 'raw',
			type: () => GraphQLJSON,
			excludeFromInputTypes: true,
			excludeFromFilterType: true,
			optional: true,
			resolve: (dataEntity) => dataEntity,
		});

	return NewEntity;
};
