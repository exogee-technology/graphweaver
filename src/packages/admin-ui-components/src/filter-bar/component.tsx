import { ReactNode, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '../button';
import {
	BooleanFilter,
	DateRangeFilter,
	DropdownTextFilter,
	EnumFilter,
	NumericFilter,
	RelationshipFilter,
	TextFilter,
	validateFilter,
} from '../filters';
import { AdminUIFilterType, decodeSearchParams, Filter, routeFor, useSchema } from '../utils';

import { useDebounce } from '../hooks';
import styles from './styles.module.css';

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity: entityName, id } = useParams();
	if (!entityName) throw new Error('There should always be an entity at this point.');
	const [search] = useSearchParams();
	const { entityByName } = useSchema();
	const navigate = useNavigate();
	const searchParams = decodeSearchParams(search);

	const [filtersState, setFiltersState] = useState(searchParams.filters ?? {});
	const debouncedFilters = useDebounce(filtersState, 800);

	const filterFieldsOnEntity = useCallback(() => {
		const entity = entityByName(entityName);
		// @todo - currently the filters are not fitting on the screen
		// we plan to redo this filter bar so that it is a drop down
		// for now the workaround is to reduce the number of filters to 5
		const fields = entity.fields
			// filter out rowEntity.fields with the JSON and Media types because they're not filterable
			.filter((field) => field.type !== 'JSON' && field.type !== 'GraphweaverMedia')
			.slice(0, 5);

		return fields;
	}, [entityName]);

	useEffect(() => {
		// On mount, check if the filters are supported by the entity
		const fields = filterFieldsOnEntity();
		const { filter, unsupportedKeys } = validateFilter(fields, debouncedFilters);

		if (unsupportedKeys.length) {
			const isPlural = unsupportedKeys.length > 1;
			toast.error(
				`Found unsupported filter ${isPlural ? 'properties' : 'property'} (${unsupportedKeys.join(
					', '
				)}) which ${isPlural ? 'have' : 'has'} been removed.`,
				{
					duration: 5000,
				}
			);

			// Go off to a supported URL.
			navigate(
				routeFor({
					entity: entityName,
					id,
					// Note: We're explicitly excluding page here so that it resets when we navigate.
					sort: searchParams.sort,
					filters: filter,
				})
			);
		}

		navigate(
			routeFor({
				entity: entityName,
				id,
				// Note: We're explicitly excluding page here so that it resets when we navigate.
				sort: searchParams.sort,
				filters: debouncedFilters,
			})
		);
	}, [debouncedFilters]);

	// This function updates the filter in state based on the filter keys updated and the newFilter value
	const onFilter = useCallback((fieldName: string, newFilter: Filter) => {
		// Remove any filters from the currentFilter that start with the same fieldName
		for (const key of Object.keys(filtersState ?? {})) {
			if (key.startsWith(fieldName)) delete filtersState?.[key];
		}

		// Combine all filters into one object
		const combinedNewFilter = {
			...filtersState,
			...newFilter,
		};

		setFiltersState(combinedNewFilter);
	}, []);

	const clearAllFilters = () => {
		navigate(
			routeFor({
				entity: entityName,
				// Note: We're explicitly excluding page here so that it resets when we navigate.
				sort: searchParams.sort,
				filters: undefined,
			})
		);
	};

	const getFilterComponents = useCallback(() => {
		const fields = filterFieldsOnEntity();

		return fields.map((field) => {
			if (field.hideInFilterBar || !field.filter?.type) return null;
			const options = {
				fieldName: field.name,
				entity: entityName,
				onChange: onFilter,
				filter: filtersState,
			};

			switch (field.filter.type) {
				case AdminUIFilterType.TEXT:
					return <TextFilter key={field.name} {...options} />;
				case AdminUIFilterType.DROP_DOWN_TEXT:
					return <DropdownTextFilter key={field.name} {...options} />;
				case AdminUIFilterType.BOOLEAN:
					return <BooleanFilter key={field.name} {...options} />;
				case AdminUIFilterType.RELATIONSHIP:
					return <RelationshipFilter key={field.name} {...options} />;
				case AdminUIFilterType.ENUM:
					return <EnumFilter key={field.name} {...options} />;
				case AdminUIFilterType.NUMERIC:
					return <NumericFilter key={field.name} {...options} />;
				case AdminUIFilterType.DATE_RANGE:
					return <DateRangeFilter key={field.name} {...options} />;
			}
		});
	}, [entityName, filtersState]);

	const filterComponents = getFilterComponents();
	if (filterComponents.length === 0) return null;

	return (
		<div className={styles.filterBarWrapper} data-testid="filter-bar">
			{iconBefore}
			{...filterComponents}
			<Button onClick={clearAllFilters}>Clear Filters</Button>
		</div>
	);
};
