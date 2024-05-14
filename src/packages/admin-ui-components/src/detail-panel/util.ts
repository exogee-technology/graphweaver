import { Entity } from '../utils';

// This is used to validate if a value is empty in the context of a form
export const isValueEmpty = (value: unknown) =>
	value === '' || value === null || value === undefined;

export const mapFormikValuesToGqlRequestValues = (
	entity: Entity,
	entityByName: (entityName: string) => Entity,
	formValues: { [fieldName: string]: unknown }
) => {
	const result: Record<string, any> = {};

	for (const field of entity.fields) {
		const value = formValues[field.name];
		const relatedEntity = entityByName(field.type);

		if (Array.isArray(value)) {
			// Multi-select fields will be an array of objects, each with a value and label
			// Map over each object in the array and create a { [primaryKey]: record_id } object
			result[field.name] = value.map((item) =>
				item && typeof item === 'object' && item.hasOwnProperty('value')
					? { [relatedEntity.primaryKeyField]: item.value }
					: item
			);
		} else if (value && typeof value === 'object' && 'value' in value) {
			// Single select fields will be an object with the ID as the value and a human readable 'label' attribute
			// Extract out a simple { id: record_id } boject
			result[field.name] = { [relatedEntity.primaryKeyField]: value.value };
		} else {
			// Otherwise just pass the value through
			result[field.name] = value;
		}
	}

	return result;
};
