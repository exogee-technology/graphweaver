import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
	Button,
	clearSelect,
	decodeSearchParams,
	FieldPredicate,
	Filter,
	routeFor,
	Select,
	SelectOption,
	useSchema,
	useSelectedEntity,
} from '..';
import { DateFilter, EnumFilter, RelationshipFilter, TextFilter } from '../filters';

import styles from './styles.module.css';

type IndexedRef = Record<string, any>; //React.MutableRefObject<any>>;

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity } = useParams();
	const [search, setSearch] = useSearchParams();
	const { entityByName, entityByType, enumByName, entities } = useSchema();
	const navigate = useNavigate();
	const [filter, setFilter] = useState<Filter>();

	if (!entity) {
		throw Error('Entity should be in URL here');
	}

	const entityType = entityByName(entity);

	// Use to control Clear button
	const refs = useRef<IndexedRef>({});

	let filters: Record<string, JSX.Element[]> = {};

	const tempSetAccountFilters = () => {
		return [
			<TextFilter
				key={'code'}
				fieldName={'code'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['code'] = el)}
			/>,
			<TextFilter
				key={'name'}
				fieldName={'name'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['name'] = el)}
			/>,
			<EnumFilter
				key={'type'}
				fieldName={'type'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['type'] = el)}
			/>,
			<RelationshipFilter
				key={'tenant'}
				fieldName={'tenant'}
				refFieldName={'tenantId'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['tenant'] = el)}
			/>,
		];
	};

	const tempSetPAndLFilters = () => {
		return [
			<DateFilter
				key={'date'}
				fieldName={'date'}
				entity={entity}
				onSelect={onDateFilter}
				ref={(el) => (refs.current['date'] = el)}
			/>,
			<TextFilter
				key={'description'}
				fieldName={'description'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['description'] = el)}
			/>,
			// <NumberFilter
			// 	key={'amount'}
			// 	fieldName={'amount'}
			// 	entity={entity}
			// 	onSelect={onFilter}
			// 	ref={(el) => (refs.current['amount'] = el)}
			// />,
			<RelationshipFilter
				key={'account'}
				fieldName={'account'}
				refFieldName={'accountId'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['account'] = el)}
			/>,
			<RelationshipFilter
				key={'tenant'}
				fieldName={'tenant'}
				refFieldName={'tenantId'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['tenant'] = el)}
			/>,
		];
	};

	const tempSetTenantFilters = () => {
		return [
			<TextFilter
				key={'tenantName'}
				fieldName={'tenantName'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['tenantName'] = el)}
			/>,
			<TextFilter
				key={'tenantType'}
				fieldName={'tenantType'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['tenantType'] = el)}
			/>,
			<DateFilter
				key={'createdDateUtc'}
				fieldName={'createdDateUtc'}
				entity={entity}
				onSelect={onDateFilter}
				ref={(el) => (refs.current['createdDateUtc'] = el)}
			/>,
			<DateFilter
				key={'updatedDateUtc'}
				fieldName={'updatedDateUtc'}
				entity={entity}
				onSelect={onDateFilter}
				ref={(el) => (refs.current['updatedDateUtc'] = el)}
			/>,
		];
	};

	const onFilter = (fieldName: string, filter?: Filter) => {
		// @todo: multiple filters working together
		// @todo: read schema to see what filter pred to use
		if (filter !== undefined) {
			// Clear all other filters
			Object.entries(refs).forEach(([name, ref]) => {
				if (name !== fieldName) {
					clearSelect(ref);
				}
			});
		}
		setFilter(filter);
	};

	const onDateFilter = (fieldName: string, filter?: Filter) => {
		// @todo: multiple filters working together
		// @todo: read schema to see what filter pred to use
		if (filter !== undefined) {
			// Clear all other filters
			Object.entries(refs).forEach(([name, ref]) => {
				if (name !== fieldName) {
					clearSelect(ref);
				}
			});
		}
		// @todo: The default date format returned is 'YYYY-MM-DD', but
		// in future we want to handle this.
		//
		// We also want to handle a date range rather than a single date,
		// but for the moment we will look at a single 24-hour period and
		// filter on that.
		//
		// Assume filter is 'equals field = value', truncate the datetime, compute the next day,
		// then set up an '_and [ _gt, _lt ]' filter
		if (filter?.filter?.kind === 'equals') {
			const startDateStr = filter.filter.value;
			const startDate = new Date(startDateStr);
			if (!!startDate.valueOf()) {
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
								kind: '_gt',
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
				setFilter(newFilter);
				return;
			}
		}
		// Dunno what's going on, just send the raw filter.
		setFilter(filter);
	};

	useEffect(() => {
		// Preserve search params - update filter segment only
		const { sort } = decodeSearchParams(search);
		navigate(routeFor({ entity, filter, sort }));
	}, [filter]);

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
		Object.values(refs).forEach((ref) => clearSelect(ref));
		setFilter(undefined);
	};

	return (
		<div className={styles.filterBarWrapper}>
			{/* // @todo: move to :before pseudoselector */}
			{iconBefore}
			{...filters[entity]}
			<Button handleClick={clearAllFilters}>Clear Filters</Button>
		</div>
	);
};
