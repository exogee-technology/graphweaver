import { ReactNode, useEffect, useReducer, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../button';
import { decodeSearchParams, FieldPredicate, Filter, isNumeric, routeFor } from '../utils';
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

	const filters: Record<string, JSX.Element[]> = {};

	// @todo: Maybe filterState options also need to be tagged by entity in case the same fieldnames recur across entities?
	// otoh can share eg. tenantId settings
	const tempSetAccountFilters = () => {
		const { options } = filterState;
		return [
			<TextFilter
				key={'code'}
				fieldName={'code'}
				entity={entity}
				onSelect={onFilter}
				selected={options['code']}
				resetCount={resetCount}
			/>,
			<TextFilter
				key={'name'}
				fieldName={'name'}
				entity={entity}
				onSelect={onFilter}
				selected={options['name']}
				resetCount={resetCount}
			/>,
			<EnumFilter
				key={'type'}
				fieldName={'type'}
				entity={entity}
				onSelect={onFilter}
				selected={options['type']}
				resetCount={resetCount}
			/>,
			<RelationshipFilter
				key={'tenant'}
				fieldName={'tenant'}
				relationshipRefFieldName={'tenantId'}
				entity={entity}
				onSelect={onFilter}
				selected={options['tenantId']}
			/>,
		];
	};

	const tempSetPAndLFilters = () => {
		const { options } = filterState;
		const dateFieldName = 'date';
		const amountFieldName = 'amount';
		return [
			<DateRangeFilter
				key={dateFieldName}
				fieldName={dateFieldName}
				onSelect={onDateRangeFilter}
				selectedStart={options[dateFieldName]}
				selectedEnd={options[`${dateFieldName}To`]}
				// ref={datePickerRef}
			/>,
			<TextFilter
				key={'description'}
				fieldName={'description'}
				entity={entity}
				onSelect={onFilter}
				selected={options['description']}
				resetCount={resetCount}
			/>,
			<NumericFilter
				key={'amount'}
				fieldName={'amount'}
				onSelect={onNumericFilter}
				selected={options['amount']}
			/>,
			<RelationshipFilter
				key={'account'}
				fieldName={'account'}
				relationshipRefFieldName={'accountId'}
				entity={entity}
				onSelect={onFilter}
				selected={options['accountId']}
			/>,
			<RelationshipFilter
				key={'tenant'}
				fieldName={'tenant'}
				relationshipRefFieldName={'tenantId'}
				entity={entity}
				onSelect={onFilter}
				selected={options['tenantId']}
			/>,
		];
	};

	const tempSetTenantFilters = () => {
		const { options } = filterState;
		return [
			<TextFilter
				key={'tenantName'}
				fieldName={'tenantName'}
				entity={entity}
				onSelect={onFilter}
				selected={options['tenantName']}
				resetCount={resetCount}
			/>,
			<TextFilter
				key={'tenantType'}
				fieldName={'tenantType'}
				entity={entity}
				onSelect={onFilter}
				selected={options['tenantType']}
				resetCount={resetCount}
			/>,
			// createdDateUtc and updatedDateUtc fields have no '..._gte' or '..._lt' fields defined in TenantsListFilter
		];
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

	const onNumberRangeFilter = (
		fieldName: string,
		minAmount?: SelectOption,
		maxAmount?: SelectOption
	) => {
		// @todo: multiple filters working together
		const newOptions: IndexedOptions = {
			...filterState.options,
			[fieldName]: minAmount,
			[`${fieldName}Max`]: maxAmount,
		};
		if (maxAmount === undefined && minAmount === undefined) {
			delete newOptions[`${fieldName}Max`];
			delete newOptions[fieldName];
			return setFilterFromOptions(newOptions);
		}

		// Setting date filter; first clear all other filters
		Object.keys(newOptions).forEach((name) => {
			if (name !== fieldName && name !== `${fieldName}Max`) {
				delete newOptions[name];
			}
			if (!maxAmount) {
				delete newOptions[`${fieldName}Max`];
			}
			if (!minAmount) {
				delete newOptions[fieldName];
			}
		});
		// Either one or both can be used in filter
		const filters: FieldPredicate[] = [];
		if (minAmount && isNumeric(minAmount.value)) {
			filters.push({
				kind: '_gte',
				field: fieldName,
				value: +minAmount.value,
			});
		}
		if (maxAmount && isNumeric(maxAmount.value)) {
			filters.push({
				kind: '_lt',
				field: fieldName,
				value: +maxAmount.value,
			});
		}
		const newFilter: Filter =
			filters.length > 1
				? {
						filter: {
							kind: '_and',
							and: [...filters],
						},
				  }
				: filters.length === 1
				? { filter: filters[0] }
				: { ...filterState.filter };
		return setFilterState({ filter: newFilter, options: newOptions });
	};

	const onDateFilter = (fieldName: string, option?: SelectOption) => {
		// @todo: multiple filters working together
		const newOptions: IndexedOptions = { ...filterState.options, [fieldName]: option };
		if (option === undefined) {
			return setFilterFromOptions(newOptions);
		}

		// Setting date filter; first clear all other filters
		Object.keys(newOptions).forEach((name) => {
			if (name !== fieldName) {
				delete newOptions[name];
			}
		});
		// Then set date filter
		// @todo: The default date format returned is 'YYYY-MM-DD', but in future we want to handle this.
		//
		// We also want to handle a date range rather than a single date,
		// but for the moment we will look at a single 24-hour period and
		// filter on that.
		//
		// Assume filter is 'equals field = value', truncate the datetime, compute the next day,
		// then set up an '_and [ _gte, _lt ]' filter
		const startDate = new Date(option.value);
		if (startDate.valueOf()) {
			// Xero: These are UTC dates
			startDate.setUTCHours(0, 0, 0, 0);
			const startDateTimeIso = startDate.toISOString();
			const endDateIso = new Date(startDate.setDate(startDate.getDate() + 1));
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

	// @todo: read schema to see what filters there are configured
	switch (entity) {
		case 'Account':
			filters[entity] = tempSetAccountFilters();
			break;
		case 'ProfitAndLossRow':
			filters[entity] = tempSetPAndLFilters();
			break;
		case 'Tenant':
			filters[entity] = tempSetTenantFilters();
			break;
		default:
	}

	const clearAllFilters = () => {
		setFilterState(emptyFilterState);
		setResetCount((resetCount) => resetCount + 1);
	};

	return (
		<div className={styles.filterBarWrapper}>
			{/* // @todo: move to :before pseudoselector */}
			{iconBefore}
			{...filters[entity]}
			<Button onClick={clearAllFilters}>Clear Filters</Button>
		</div>
	);
};
