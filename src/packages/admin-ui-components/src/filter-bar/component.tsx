import { ReactNode, useEffect, useReducer, useState, createElement } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../button';
import {
	AdminUIFilterType,
	decodeSearchParams,
	FieldPredicate,
	Filter,
	isNumeric,
	routeFor,
	useSchema,
} from '../utils';
import { SelectOption } from '../';
import {
	DateRangeFilter,
	EnumFilter,
	NumericFilter,
	RelationshipFilter,
	TextFilter,
} from '../filters';

import styles from './styles.module.css';

type IndexedOptions = Record<string, any>;

interface FilterState {
	filter: Filter;
	options: IndexedOptions;
}

const emptyFilterState: FilterState = { filter: {}, options: {} };

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity } = useParams();
	const [resetCount, setResetCount] = useState(0);
	const [search, setSearch] = useSearchParams();
	const { entityByName } = useSchema();
	const navigate = useNavigate();

	const [filterState, setFilterState] = useReducer((prev: FilterState, next: FilterState) => {
		const newState = { ...prev, ...next };
		return newState;
	}, emptyFilterState);

	const setFilterFromOptions = (options?: IndexedOptions) => {
		const newState = { filter: {}, options: options ?? {} };
		for (const [field, option] of Object.entries(newState.options)) {
			// @todo: limited at present to 'equals' and just one option
			// Just pick the first defined option
			if (option) {
				newState.filter = {
					filter: { kind: 'equals', field, value: option.value },
				};
				break;
			}
		}
		setFilterState(newState);
	};

	if (!entity) {
		throw Error('Entity should be in URL here');
	}

	const getFilters = (entityName: string) => {
		const { options } = filterState;
		const profitAndLossRowEntity = entityByName(entityName);

		return profitAndLossRowEntity.fields
			.map((field) => {
				if (field.filter?.type === AdminUIFilterType.TEXT) {
					return createElement(TextFilter, {
						key: field.name,
						fieldName: field.name,
						entity: entity,
						selected: options[field.name],
						onSelect: onFilter,
						resetCount: resetCount,
					});
				}

				if (field.filter?.type === AdminUIFilterType.DATE_RANGE) {
					return createElement(DateRangeFilter, {
						key: field.name,
						fieldName: field.name,
						onSelect: onDateRangeFilter,
						selectedStart: options[field.name],
						selectedEnd: options[`${field.name}To`],
						resetCount: resetCount,
					});
				}

				if (field.filter?.type === AdminUIFilterType.NUMERIC) {
					return createElement(NumericFilter, {
						key: field.name,
						fieldName: field.name,
						selected: options[field.name],
						onSelect: onNumericFilter,
						resetCount: resetCount,
					});
				}

				if (field.filter?.type === AdminUIFilterType.RELATIONSHIP) {
					return createElement(RelationshipFilter, {
						key: field.name,
						fieldName: field.name,
						relationshipRefFieldName: 'accountId',
						entity: entity,
						selected: options[field.name],
						onSelect: onFilter,
						resetCount: resetCount,
					});
				}

				if (field.filter?.type === AdminUIFilterType.ENUM) {
					return createElement(EnumFilter, {
						key: field.name,
						fieldName: field.name,
						entity: entity,
						selected: options[field.name],
						onSelect: onFilter,
						resetCount: resetCount,
					});
				}
			})
			.filter((field): field is React.FunctionComponentElement<any> => !!field);
	};

	const onFilter = (fieldName: string, option?: SelectOption) => {
		// @todo: multiple filters working together
		const newOptions: IndexedOptions = { ...filterState.options, [fieldName]: option };
		if (option !== undefined) {
			// Clear all other filters
			Object.keys(newOptions).forEach((name) => {
				if (name !== fieldName) {
					delete newOptions[name];
				}
			});
		}
		// Set filter from options only
		setFilterFromOptions(newOptions);
	};

	const onNumericFilter = (fieldName: string, option?: SelectOption) => {
		// @todo: multiple filters working together
		const newOptions: IndexedOptions = { ...filterState.options, [fieldName]: option };
		if (option !== undefined) {
			// Clear all other filters
			Object.keys(newOptions).forEach((name) => {
				if (name !== fieldName) {
					delete newOptions[name];
				}
			});
		}
		// MinAmount only for now...
		if (option?.label === 'minAmount' && isNumeric(option.value)) {
			const newFilter: Filter = {
				filter: {
					kind: '_gte',
					field: fieldName,
					value: +option.value,
				},
			};
			return setFilterState({ filter: newFilter, options: newOptions });
		}
		// Dunno what's going on, just update options.
		return setFilterState({ ...filterState, options: newOptions });
	};

	const onDateRangeFilter = (
		fieldName: string,
		startDate?: SelectOption,
		endDate?: SelectOption
	) => {
		// @todo: multiple filters working together
		const newOptions: IndexedOptions = {
			...filterState.options,
			[fieldName]: startDate,
		};
		if (startDate === undefined) {
			delete newOptions[`${fieldName}To`];
			return setFilterFromOptions(newOptions);
		}
		if (endDate) {
			newOptions[`${fieldName}To`] = endDate;
		}

		// Setting date filter; first clear all other filters
		Object.keys(newOptions).forEach((name) => {
			if (name !== fieldName && name !== `${fieldName}To`) {
				delete newOptions[name];
			}
			if (!endDate) {
				delete newOptions[`${fieldName}To`];
			}
		});
		// Then set date filter
		// @todo: The default date format returned is 'YYYY-MM-DD', but in future we want to handle this.
		//
		// If we are passed only a single date, use 24-hour period and filter on that.
		// Assume filter is 'equals field = value', truncate the datetime, compute the next day,
		// then set up an '_and [ _gte, _lt ]' filter
		//
		// Otherwise, use both dates.
		const start = new Date(startDate.value);
		const end = endDate ? new Date(endDate.value) : undefined;
		if (start.valueOf()) {
			// Xero: These are UTC dates
			start.setUTCHours(0, 0, 0, 0);
			const startDateTimeIso = start.toISOString();
			if (end && end.valueOf()) {
				end.setUTCHours(0, 0, 0, 0);
			}
			const endDateIso = end && end.valueOf() ? end : new Date(start.setDate(start.getDate() + 1));
			const endDateTimeIso = endDateIso.toISOString();
			const newFilter: Filter = {
				filter: {
					kind: '_and',
					and: [
						{
							kind: '_gte',
							field: fieldName,
							value: startDateTimeIso,
						},
						{
							kind: '_lt',
							field: fieldName,
							value: endDateTimeIso,
						},
					],
				},
			};
			return setFilterState({ filter: newFilter, options: newOptions });
		}
		// Dunno what's going on, just update options.
		return setFilterState({ ...filterState, options: newOptions });
	};

	useEffect(() => {
		// Preserve search params - update filter segment only
		const { sort } = decodeSearchParams(search);
		navigate(routeFor({ entity, filter: filterState.filter, sort }));
	}, [filterState.filter]);

	const filters = getFilters(entity);

	const clearAllFilters = () => {
		setFilterState(emptyFilterState);
		setResetCount((resetCount) => resetCount + 1);
	};

	return (
		<>
			{filters.length > 0 && (
				<div className={styles.filterBarWrapper}>
					{iconBefore}
					{...filters}
					<Button onClick={clearAllFilters}>Clear Filters</Button>
				</div>
			)}
		</>
	);
};
