import { ReactNode, useEffect, useState, createElement } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../button';
import { AdminUIFilterType, decodeSearchParams, Filter, routeFor, useSchema } from '../utils';
import {
	DateRangeFilter,
	DateRangeFilterType,
	EnumFilter,
	NumericFilter,
	RelationshipFilter,
	RelationshipFilterType,
	TextFilter,
} from '../filters';

import styles from './styles.module.css';
import { BooleanFilter } from '../filters/boolean-filter';

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity, id } = useParams();
	if (!entity) throw new Error('There should always be an entity at this point.');
	const [resetCount, setResetCount] = useState(0);
	const [search] = useSearchParams();
	const { entityByName } = useSchema();
	const navigate = useNavigate();
	const searchParams = decodeSearchParams(search);
	const [filter, setFilter] = useState(searchParams.filters ?? entityByName(entity).defaultFilter);

	if (!entity) {
		throw Error('Entity should be in URL here');
	}

	// This function updates the filter in state based on fieldName and newFilter values
	const onFilter = (fieldName: string, newFilter?: Filter) => {
		setFilter((currentFilter) => {
			if (!newFilter) {
				// If no newFilter provided, remove the existing one for this fieldName from current filter
				delete currentFilter?.[fieldName];

				// Return undefined if there's nothing left in the filter.
				const filterIsEmpty = Object.keys(currentFilter ?? {}).length === 0;
				if (filterIsEmpty) return undefined;

				// If filter is not empty, return a copy of currentFilter (to prevent mutations to state directly affecting future rendering)
				return { ...currentFilter };
			}

			// If newFilter provided, update the existing one for this fieldName with new values
			return { ...currentFilter, ...newFilter };
		});
	};

	const getFilterComponents = (entityName: string) => {
		const rowEntity = entityByName(entityName);

		// @todo - currently the filters are not fitting on the screen
		// we plan to redo this filter bar so that it is a drop down
		// for now the workaround is to reduce the number of filters to 5

		const showOnlyFiveFilters = rowEntity.fields.length > 5 ? 5 : rowEntity.fields.length;
		return (
			rowEntity.fields
				// filter out rowEntity.fields with the JSON type
				.filter((field) => field.type !== 'JSON')
				.slice(0, showOnlyFiveFilters)
				.map((field) => {
					if (!field.filter?.type) return null;
					const options = {
						key: field.name,
						fieldName: field.name,
						entity: entity,
						onChange: onFilter,
						resetCount: resetCount,
					};

					switch (field.filter.type) {
						case AdminUIFilterType.TEXT:
							return createElement(TextFilter, {
								...options,
								initialValue: filter?.[field.name] as string | undefined,
							});
						case AdminUIFilterType.BOOLEAN:
							return createElement(BooleanFilter, {
								...options,
								initialValue: filter?.[field.name] as boolean | undefined,
							});
						case AdminUIFilterType.RELATIONSHIP:
							return createElement(RelationshipFilter, {
								...options,
								initialValue: filter?.[field.name] as RelationshipFilterType | undefined,
							});
						case AdminUIFilterType.ENUM:
							return createElement(EnumFilter, {
								...options,
								initialValue: filter?.[field.name] as string | undefined,
							});
						case AdminUIFilterType.NUMERIC:
							return createElement(NumericFilter, {
								...options,
								initialValue: filter?.[field.name] as number | undefined,
							});
						case AdminUIFilterType.DATE_RANGE:
							return createElement(DateRangeFilter, {
								...options,
								initialValue: filter?.[field.name] as DateRangeFilterType | undefined,
							});
					}
				})
		);
	};

	useEffect(() => {
		const { sort } = decodeSearchParams(search);
		navigate(
			routeFor({
				entity,
				filters: Object.keys(filter ?? {}).length > 0 ? filter : undefined,
				sort,
				id,
			})
		);
	}, [filter]);

	const filterComponents = getFilterComponents(entity);

	const clearAllFilters = () => {
		setFilter({});
		setResetCount((resetCount) => resetCount + 1);
	};

	if (filterComponents.length === 0) return null;

	return (
		<div className={styles.filterBarWrapper}>
			{iconBefore}
			{...filterComponents}
			<Button onClick={clearAllFilters}>Clear Filters</Button>
		</div>
	);
};
