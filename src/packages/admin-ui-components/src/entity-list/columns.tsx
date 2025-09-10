import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { generateJSON, generateText } from '@tiptap/react';
import { DateTime } from 'luxon';
import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';
import { Link } from 'wouter';
import { Checkbox } from '../checkbox';
import { getExtensions } from '../detail-panel/fields/rich-text-field/utils';
import { cells } from '../table/cells';
import { DetailPanelInputComponentOption, Entity, EntityField, routeFor } from '../utils';

const richTextExtensions = getExtensions({});

// Constants
const CHECKBOX_COLUMN_WIDTH = 48;

const formatValue = (field: EntityField, value: unknown): string | number | null => {
	if (!field.format) {
		return value as string | number | null;
	} else if (field.format?.type === 'date') {
		if (!value) return null;

		try {
			let date = DateTime.fromISO(value as string);
			if (!date.isValid) {
				console.warn(`Invalid date value: ${value} for field: ${field.name}`);
				return value as string;
			}

			if (field.format?.timezone) {
				date = date.setZone(field.format.timezone ?? 'UTC');
			}
			if (field.format?.format && DateTime[field.format.format as keyof typeof DateTime]) {
				return date.toLocaleString(DateTime[field.format.format as keyof typeof DateTime] as any);
			}
			return date.toLocaleString(DateTime.DATETIME_FULL);
		} catch (error) {
			console.error('Date formatting error:', error, { value, fieldName: field.name });
			return value as string;
		}
	} else if (field.format?.type === 'currency') {
		return typeof value === 'string'
			? parseFloat(value).toLocaleString('en-AU', {
					style: 'currency',
					currency: field.format.variant,
				})
			: (value as number).toLocaleString('en-AU', {
					style: 'currency',
					currency: field.format.variant,
				});
	}
	return value as string | number | null;
};

const cellForType = (
	field: EntityField,
	value: unknown,
	entityByType: (type: string) => Entity
): React.ReactNode => {
	// Is there a specific definition for the cell type?
	if (cells[field.type as keyof typeof cells]) {
		return cells[field.type as keyof typeof cells](value as any);
	}

	// If not, is it a relationship?
	if (field.relationshipType) {
		// For relationships with 'count' behaviour, show count instead of links
		if (field.relationshipBehaviour === 'count') {
			if (!value || typeof value !== 'object' || !('count' in value)) return '0';
			const count = (value as { count: number }).count;
			return `${count} ${field.type.toLowerCase()}s`;
		}

		const relatedEntity = entityByType(field.type);

		const linkForValue = (item: any) => {
			if (relatedEntity) {
				const key = relatedEntity.primaryKeyField;
				const label = relatedEntity.summaryField ?? key;
				return (
					<Link
						key={item[key]}
						to={routeFor({ type: field.type, id: item[key] })}
						onClick={(e) => e.stopPropagation()}
					>
						{item[label]}
					</Link>
				);
			}
			return item.label;
		};

		if (!value) return null;

		if (Array.isArray(value)) {
			return value.flatMap((item) => [linkForValue(item), ', ']).slice(0, -1);
		} else {
			return linkForValue(value);
		}
	}

	// Is it an array?
	if (Array.isArray(value)) {
		return value.map((item) => formatValue(field, item)).join(', ');
	}

	if (field.detailPanelInputComponent?.name === DetailPanelInputComponentOption.RICH_TEXT) {
		if (!value) return null;
		try {
			const json = generateJSON(value as string, richTextExtensions);
			return <div>{generateText(json, richTextExtensions)}</div>;
		} catch (error) {
			console.error('Rich text rendering error:', error, { value, fieldName: field.name });
			return <div title="Failed to render rich text">{String(value)}</div>;
		}
	}

	// Ok, all we're left with is a simple value
	return formatValue(field, value);
};

const isFieldSortable = (field: EntityField): boolean => {
	if (field.type === 'JSON') {
		return false;
	}

	if (field.type === 'GraphweaverMedia') {
		return false;
	}

	if (field.relationshipType) {
		return false;
	}

	if (field.isArray) {
		return false;
	}

	return true;
};

const addRowCheckboxColumn = <T extends Record<string, unknown>>() => {
	const columnHelper = createColumnHelper<T>();
	return columnHelper.accessor('select' as any, {
		id: 'select',
		enableSorting: false,
		size: CHECKBOX_COLUMN_WIDTH,
		minSize: CHECKBOX_COLUMN_WIDTH,
		maxSize: CHECKBOX_COLUMN_WIDTH,
		header: ({ table }: { table: any }) => (
			<Checkbox
				{...{
					checked: table.getIsAllRowsSelected(),
					indeterminate: table.getIsSomeRowsSelected(),
					onChange: table.getToggleAllRowsSelectedHandler(),
				}}
			/>
		),
		cell: ({ row }: { row: any }) => (
			<Checkbox
				{...{
					checked: row.getIsSelected(),
					disabled: !row.getCanSelect(),
					indeterminate: row.getIsSomeSelected(),
					onChange: row.getToggleSelectedHandler(),
				}}
			/>
		),
	});
};

export const convertEntityToColumns = <T extends Record<string, unknown>>(
	entity: Entity,
	entityByType: (type: string) => Entity
) => {
	// Input validation
	if (!entity?.fields) {
		console.warn('Entity has no fields:', entity);
		return [];
	}

	if (typeof entityByType !== 'function') {
		throw new Error('entityByType must be a function');
	}

	const columnHelper = createColumnHelper<T>();

	const entityColumns = entity.fields
		.filter((field) => !field.hideInTable)
		.map((field) => {
			// For relationship fields with count behaviour, the GraphQL field name is different
			const accessorFieldName =
				field.relationshipType && field.relationshipBehaviour === 'count'
					? `${field.name}_aggregate`
					: field.name;

			return columnHelper.accessor(accessorFieldName as any, {
				id: field.name,
				header: () => field.name,
				cell: (info: CellContext<T, unknown>) => cellForType(field, info.getValue(), entityByType),
				enableSorting: isFieldSortable(field),
			});
		});

	// Which custom fields do we need to show here?
	const customFieldsToShow = (customFields?.get(entity.name) || []).filter(
		(field) => !field.hideInTable
	);

	// Remove any fields that the user intends to replace with a custom field so
	// their custom field indices are correct regardless of insertion order
	for (const customField of customFieldsToShow) {
		const index = entityColumns.findIndex((column) => column.id === customField.name);
		if (index !== -1) {
			entityColumns.splice(index, 1);
		}
	}

	// Ok, now we can merge our custom fields in
	for (const customField of customFieldsToShow) {
		const column = columnHelper.accessor(customField.name as any, {
			id: customField.name,
			header: () => customField.name,
			cell: (info: CellContext<T, unknown>) =>
				customField.component?.({ context: 'table', entity: info.row.original }),
			enableSorting: false,
		});
		entityColumns.splice(customField.index ?? entityColumns.length, 0, column);
	}

	// Add the row selection column if the entity is not read-only
	if (!entity.attributes.isReadOnly) {
		return [addRowCheckboxColumn<T>(), ...entityColumns];
	}

	return entityColumns;
};
