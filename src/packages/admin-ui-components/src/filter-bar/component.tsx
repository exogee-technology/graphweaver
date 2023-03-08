import { ReactNode, useEffect, useReducer, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, decodeSearchParams, Filter, routeFor, SelectOption } from '..';
import { DateFilter, EnumFilter, RelationshipFilter, TextFilter } from '../filters';

import styles from './styles.module.css';

type IndexedRefs = Record<string, any>;
type IndexedOptions = Record<string, any>;

interface FilterState {
	filter: Filter;
	options: IndexedOptions;
}

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity } = useParams();
	const [search, setSearch] = useSearchParams();
	const navigate = useNavigate();
	const [filterState, setFilterState] = useReducer(
		(prev: FilterState, next: FilterState) => {
			const newState = { ...prev, ...next };
			return newState;
		},
		{ filter: {}, options: {} }
	);

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
			/>,
			<TextFilter
				key={'name'}
				fieldName={'name'}
				entity={entity}
				onSelect={onFilter}
				selected={options['name']}
			/>,
			<EnumFilter
				key={'type'}
				fieldName={'type'}
				entity={entity}
				onSelect={onFilter}
				selected={options['type']}
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
		return [
			<DateFilter
				key={'date'}
				fieldName={'date'}
				entity={entity}
				onSelect={onDateFilter}
				selected={options['date']}
			/>,
			<TextFilter
				key={'description'}
				fieldName={'description'}
				entity={entity}
				onSelect={onFilter}
				selected={options['description']}
			/>,
			// @todo: 'amount' filter on numbers range

			// @todo: Handle null accountId; currently this filter will not exclude null account IDs
			// @todo: (backend problem)
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
			/>,
			<TextFilter
				key={'tenantType'}
				fieldName={'tenantType'}
				entity={entity}
				onSelect={onFilter}
				selected={options['tenantType']}
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
					newOptions[name] = undefined;
				}
			});
		}
		// Set filter from options only
		setFilterFromOptions(newOptions);
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
				newOptions[name] = undefined;
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
		setFilterFromOptions({});
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
