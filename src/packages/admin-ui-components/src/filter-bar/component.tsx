import { ReactNode, useEffect, useState, createElement, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Button } from '../button';
import { AdminUIFilterType, decodeSearchParams, Filter, routeFor, useSchema } from '../utils';
import {
	BooleanFilter,
	validateFilter,
	DateRangeFilter,
	EnumFilter,
	NumericFilter,
	RelationshipFilter,
	TextFilter,
} from '../filters';

import styles from './styles.module.css';

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity: entityName, id } = useParams();
	if (!entityName) throw new Error('There should always be an entity at this point.');
	const [resetCount, setResetCount] = useState(0);
	const [search] = useSearchParams();
	const { entityByName } = useSchema();
	const navigate = useNavigate();
	const searchParams = decodeSearchParams(search);
	const [filters, setFilters] = useState(
		searchParams.filters ?? entityByName(entityName).defaultFilter
	);

	const filterFieldsOnEntity = useCallback(() => {
		const entity = entityByName(entityName);
		// @todo - currently the filters are not fitting on the screen
		// we plan to redo this filter bar so that it is a drop down
		// for now the workaround is to reduce the number of filters to 5
		const showOnlyFiveFilters = entity.fields.length > 5 ? 5 : entity.fields.length;
		const fields = entity.fields
			// filter out rowEntity.fields with the JSON type
			.filter((field) => field.type !== 'JSON')
			.slice(0, showOnlyFiveFilters);

		return fields;
	}, [entityName]);

	useEffect(() => {
		// On mount, check if the filters are supported by the entity
		const fields = filterFieldsOnEntity();
		const { filter, unsupportedKeys } = validateFilter(fields, filters);

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
			setFilters(filter);
		}
	}, []);

	useEffect(() => {
		const { sort } = decodeSearchParams(search);
		navigate(
			routeFor({
				entity: entityName,
				filters,
				sort,
				id,
			})
		);
	}, [filters]);

	// This function updates the filter in state based on the filter keys updated and the newFilter value
	const onFilter = (fieldName: string, newFilter: Filter) => {
		setFilters((currentFilter) => {
			// Remove any filters from the currentFilter that start with the same fieldName
			const currentFilterKeys = Object.keys(currentFilter ?? {});
			const keysToRemove = currentFilterKeys.filter((key) => key.startsWith(fieldName));
			for (const key of keysToRemove) {
				delete currentFilter?.[key];
			}

			// Combine all filters into one object
			const combinedNewFilter = {
				...currentFilter,
				...newFilter,
			};

			// Return undefined if there's nothing left in the filter.
			const isFilterEmpty = Object.keys(combinedNewFilter).length === 0;
			if (isFilterEmpty) return undefined;

			// If filter is not empty, return a copy of currentFilter (to prevent mutations to state directly affecting future rendering)
			return { ...combinedNewFilter };
		});
	};

	const clearAllFilters = () => {
		setFilters(undefined);
		setResetCount((resetCount) => resetCount + 1);
	};

	const getFilterComponents = useCallback(() => {
		const fields = filterFieldsOnEntity();

		return fields.map((field) => {
			if (!field.filter?.type) return null;
			const options = {
				key: field.name,
				fieldName: field.name,
				entity: entityName,
				onChange: onFilter,
				resetCount: resetCount,
				initialFilter: filters,
			};

			switch (field.filter.type) {
				case AdminUIFilterType.TEXT:
					return createElement(TextFilter, options);
				case AdminUIFilterType.BOOLEAN:
					return createElement(BooleanFilter, options);
				case AdminUIFilterType.RELATIONSHIP:
					return createElement(RelationshipFilter, options);
				case AdminUIFilterType.ENUM:
					return createElement(EnumFilter, options);
				case AdminUIFilterType.NUMERIC:
					return createElement(NumericFilter, options);
				case AdminUIFilterType.DATE_RANGE:
					return createElement(DateRangeFilter, options);
			}
		});
	}, [entityName, filters, resetCount]);

	const filterComponents = getFilterComponents();
	if (filterComponents.length === 0) return null;

	return (
		<div className={styles.filterBarWrapper}>
			{iconBefore}
			{...filterComponents}
			<Button onClick={clearAllFilters}>Clear Filters</Button>
		</div>
	);
};
