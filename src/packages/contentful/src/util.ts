import { FieldOptions } from '@exogee/graphweaver-helpers';
import { ContentTypeField, Entry } from 'contentful';

// Add resolver to fields that are not plain values
export const addResolveToFields = (fields: Array<FieldOptions<any>>): Array<FieldOptions<any>> =>
	fields.map((field) => {
		switch (field.metadata?.type) {
			case 'RichText':
				return {
					...field,
					resolve: (data, fieldName) => JSON.stringify(data[fieldName].content),
				};
		}
		return field;
	});

// Convert from contentful format to graphql
export const mapContentfulItem = (item: Entry<any, any, any>, fields: Array<FieldOptions<any>>) => {
	const mappedItem: Record<string, any> = { id: item.sys.id };
	for (const fieldKey of fields.map((field) => field.name)) {
		mappedItem[fieldKey] = item.fields[fieldKey];
	}
	return mappedItem;
};

export const fieldFromContentfulTypeField = ({
	id,
	type,
	required,
	disabled,
}: ContentTypeField): FieldOptions<any> | undefined => {
	if (disabled) return;
	switch (type) {
		case 'Symbol':
		case 'Text':
		case 'RichText':
			return {
				name: id,
				optional: !required,
				type: 'string',
				metadata: { type },
			};
		case 'Boolean':
			return {
				name: id,
				optional: !required,
				type: 'boolean',
				metadata: { type },
			};
		case 'Number':
		case 'Integer':
			return {
				name: id,
				optional: !required,
				type: 'float',
				metadata: { type },
			};
	}
};

export const caps = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
