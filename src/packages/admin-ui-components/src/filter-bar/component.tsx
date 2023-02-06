import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
	Button,
	clearValue,
	decodeSearchParams,
	Filter,
	routeFor,
	Select,
	SelectOption,
	useSchema,
	useSelectedEntity,
} from '..';

import styles from './styles.module.css';

const dummyOptions = [
	{ label: 'Option 1', value: 1 },
	{ label: 'Option 2', value: 2 },
	{ label: 'Option 3', value: 3 },
];

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity } = useParams();
	const [search, setSearch] = useSearchParams();
	console.log('DEBUG calling useSchema from FilterBar');
	const { entityByName, entityByType, enumByName, entities } = useSchema();
	const navigate = useNavigate();
	const [filter, setFilter] = useState<Filter>();

	// Use to control Clear button
	const ref = useRef(null);

	if (!entity) {
		throw Error('Entity should be in URL here');
	}

	const entityType = entityByName(entity);

	let filters = [
		<Select key={Math.random()} options={dummyOptions} />,
		<Select key={Math.random()} options={dummyOptions} />,
		<Select key={Math.random()} options={dummyOptions} />,
		<Select key={Math.random()} options={dummyOptions} />,
	];

	const tempSetAccountsFilters = () => {
		// TODO: -------------------------------------------------------
		// TODO: Cache all these in a useMemo provider, perhaps on load,
		// TODO: then pass them down here
		// TODO: -------------------------------------------------------
		const typeField = entityType.fields.find((f) => f.name === 'type');
		let typeEnumOptions: SelectOption[] = [];
		if (typeField) {
			const typeEnum = enumByName(typeField.type);
			typeEnumOptions = Array.from(typeEnum.values).map((v) => ({
				label: v.name,
				value: v.value,
			}));
		}
		const tenantField = entityType.fields.find((f) => f.name === 'tenant');
		let tenantOptions: SelectOption[] = [];
		if (tenantField && tenantField.relationshipType === 'm:1') {
			// @todo: query back all tenant ID/name pairs
			const tenantEntityType = entityByType(tenantField.type);
		}
		// (code) (name) type (tenant)
		return [
			// <Select key={'CODE'} options={dummyOptions} placeholder={'CODE*'} isClearable />,
			// <Select key={'NAME'} options={dummyOptions} placeholder={'NAME*'} isClearable />,
			<Select
				key={'TYPE'}
				options={typeEnumOptions}
				placeholder={'TYPE'}
				isClearable
				clearSelection
				ref={ref}
				onChange={onFilterType}
			/>,
			// <Select key={'TENANT'} options={dummyOptions} placeholder={'TENANT*'} isClearable />,
		];
	};

	const onFilterType = (option?: SelectOption) => {
		// option will be empty if 'clear' selected
		// @todo: multiple filters
		if (!option) {
			setFilter(undefined);
			return;
		}
		// @todo: read schema to see what filter pred to use
		setFilter({ filter: { kind: 'equals', field: 'type', value: option.value } });
	};

	useEffect(() => {
		// Preserve search params - update filter segment only
		const { sort } = decodeSearchParams(search);
		navigate(routeFor({ entity, filter, sort }));
	}, [filter]);

	// @todo: read schema to see what filters there are configured
	switch (entity) {
		case 'Account':
			filters = tempSetAccountsFilters();
		default:
	}

	const clearAllFilters = () => {
		clearValue(ref);
		setFilter(undefined);
	};

	return (
		<div className={styles.filterBarWrapper}>
			{/* // @todo: move to :before pseudoselector */}
			{iconBefore}
			{...filters}
			<Button handleClick={clearAllFilters}>Clear Filters</Button>
		</div>
	);
};
