import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';
import { Link } from 'react-router-dom';

import { Entity, EntityField, routeFor } from '../utils';
import { cells } from '../table/cells';
import { Checkbox } from '../checkbox';

const columnHelper = createColumnHelper<any>();

const cellForType = (field: EntityField, value: any, entityByType: (type: string) => Entity) => {
	// Is there a specific definition for the cell type?
	if (cells[field.type as keyof typeof cells]) {
		return cells[field.type as keyof typeof cells](value);
	}

	// If not, is it a relationship?
	if (field.relationshipType) {
		const relatedEntity = entityByType(field.type);

		const linkForValue = (item: any) =>
			relatedEntity ? (
				<Link
					key={item.value}
					to={routeFor({ type: field.type, id: item.value })}
					onClick={(e) => e.stopPropagation()}
				>
					{item.label}
				</Link>
			) : (
				item.label
			);

		if (!value) return null;

		if (Array.isArray(value)) {
			return value.flatMap((item) => [linkForValue(item), ', ']).slice(0, -1);
		} else {
			return linkForValue(value);
		}
	}

	// Is it an array?
	if (Array.isArray(value)) {
		return value.join(', ');
	}

	// Ok, all we're left with is a simple value
	return value;
};

const isFieldSortable = (field: EntityField) => {
	if (field.type === 'JSON') {
		return false;
	}

	if (field.type === 'Media') {
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

const addRowCheckboxColumn = () => {
	return columnHelper.accessor('select', {
		id: 'select',
		enableSorting: false,
		size: 48,
		minSize: 48,
		maxSize: 48,
		header: ({ table }) => (
			<Checkbox
				{...{
					checked: table.getIsAllRowsSelected(),
					indeterminate: table.getIsSomeRowsSelected(),
					onChange: table.getToggleAllRowsSelectedHandler(),
				}}
			/>
		),
		cell: ({ row }) => (
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

export const convertEntityToColumns = (entity: Entity, entityByType: (type: string) => Entity) => {
	const entityColumns = entity.fields
		.filter((field) => !field.hideInTable)
		.map((field) =>
			columnHelper.accessor(field.name, {
				id: field.name,
				header: () => field.name,
				cell: (info) => cellForType(field, info.getValue(), entityByType),
				enableSorting: isFieldSortable(field),
			})
		);

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
		const column = columnHelper.accessor(customField.name, {
			id: customField.name,
			header: () => customField.name,
			cell: (info: CellContext<unknown, unknown>) =>
				customField.component?.({ context: 'table', entity: info.row.original }),
			enableSorting: false,
		});
		entityColumns.splice(customField.index ?? entityColumns.length, 0, column);
	}

	// Add the row selection column if the entity is not read-only
	if (!entity.attributes.isReadOnly) {
		return [addRowCheckboxColumn(), ...entityColumns];
	}

	return entityColumns;
};
