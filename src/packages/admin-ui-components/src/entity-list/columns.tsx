import { createColumnHelper } from '@tanstack/react-table';
import { Entity, EntityField, UnixNanoTimestamp, routeFor } from '../utils';
import { Link } from 'react-router-dom';

const columnHelper = createColumnHelper<any>();

const jsonCell = (value: any) => <div>{JSON.stringify(value)}</div>;

const booleanCell = (value: any) => `${value}`;

const nanoDurationCell = (value: any) => {
	const duration = UnixNanoTimestamp.fromString(value);
	const { value: displayValue, unit } = duration.toSIUnits();
	return (
		<span>
			{Number(displayValue).toFixed(2)} {unit}
		</span>
	);
};

const nanoTimestampCell = (value: any) => {
	const timestamp = UnixNanoTimestamp.fromString(value);
	return <span>{timestamp.toDate().toLocaleString()}</span>;
};

const mediaCell = (value: any) => {
	const media = value as {
		url: string;
		type: 'IMAGE' | 'OTHER';
	};
	if (!media) {
		return null;
	}

	if (media.type === 'IMAGE') {
		return (
			<img
				src={media.url}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					padding: 2,
					borderRadius: 8,
					objectPosition: 'center center',
					textIndent: -9999,
				}}
				onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) =>
					(e.currentTarget.style.display = 'none')
				}
			/>
		);
	}

	return (
		<a href={media.url} target="_blank" rel="noreferrer">
			{media.url}
		</a>
	);
};

const cells = {
	JSON: jsonCell,
	Boolean: booleanCell,
	NanoDuration: nanoDurationCell,
	NanoTimestamp: nanoTimestampCell,
	Media: mediaCell,
};

const cellForType = (field: EntityField, value: any, entityByType: (type: string) => Entity) => {
	// Check if the field is a relationship
	if (field.relationshipType) {
		const relatedEntity = entityByType(field.type);

		const linkForValue = (id: any) =>
			relatedEntity ? (
				<Link
					key={value.value}
					to={routeFor({ type: field.type, id })}
					onClick={(e) => e.stopPropagation()}
				>
					{value.label}
				</Link>
			) : (
				value.label
			);

		if (Array.isArray(value)) {
			return value.flatMap((item) => [linkForValue(item), ', ']).slice(0, -1);
		} else if (value) {
			return linkForValue(value);
		} else {
			return null;
		}
	}

	// Check if the field is an array and join the values
	if (Array.isArray(value)) {
		return value.join(', ');
	}

	// Check if the field has a custom cell renderer
	return cells[field.type as keyof typeof cells]?.(value) || value;
};

export const convertEntityToColumns = (
	fields: EntityField[],
	entityByType: (type: string) => Entity
) => {
	return fields
		.filter((field) => !!!field.hideInTable)
		.map((field) =>
			columnHelper.accessor(field.name, {
				header: () => field.name,
				cell: (info) => cellForType(field, info.getValue(), entityByType),
			})
		);
};
