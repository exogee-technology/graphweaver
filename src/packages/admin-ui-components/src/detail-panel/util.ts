import { Entity, EntityField } from "../utils";

// This is used to validate if a value is empty in the context of a form
export const isValueEmpty = (value: unknown) =>
	value === '' || value === null || value === undefined;

/**
 * Value should not be undefined because the input that renders it will switch from uncontrolled to controlled and React will throw an error.
 * Also, if value is a JSON object, we stringify it.
 */
export const parseValueForForm = (fieldType: string, value: unknown, entity?: Entity) => {
	if (value === undefined) {
		return null;
	}

	if (fieldType === 'JSON' && value) {
		return JSON.stringify(value, null, 4);
	 }

	return value;
};

const isObjectWithKeys = <T extends Record<string, unknown>, K extends keyof T, S extends keyof T>(value: unknown, key: K, summaryField: S): value is T & { [P in K | S]: unknown } => {
	return typeof value === 'object' && value !== null && key in value && summaryField in value;
};

export const transformValueForForm = (field: EntityField, value: unknown, entityByType: (entityType: string) => Entity) => {
	if (field.relationshipType) {
		const relatedEntity = entityByType(field.type);
		const relatedEntityPrimaryKeyField = relatedEntity?.primaryKeyField;
		const relatedEntitySummaryField = relatedEntity?.summaryField ?? relatedEntityPrimaryKeyField;

		if (field.relationshipType === 'MANY_TO_ONE') {
			if (isObjectWithKeys(value, relatedEntityPrimaryKeyField, relatedEntitySummaryField)) {
				return {
					value: value[relatedEntityPrimaryKeyField],
					label: value[relatedEntitySummaryField],
				};
			}
		} else if (field.relationshipType === 'MANY_TO_MANY') {
			if (Array.isArray(value)) {
				return value.map((item) => ({
					value: item[relatedEntityPrimaryKeyField],
					label: item[relatedEntitySummaryField],
				}));
			}
			return value;
		}
	}
	return value;
};
