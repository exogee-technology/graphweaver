import { ReactNode, useEffect, useReducer, useState, createElement } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../button';
import { AdminUIFilterType, decodeSearchParams, Filter, routeFor, useSchema } from '../utils';
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
	const [search] = useSearchParams();
	const { entityByName } = useSchema();
	const navigate = useNavigate();
	const [filter, setFilter] = useState<{ [x: string]: Filter | undefined }>({});

	if (!entity) {
		throw Error('Entity should be in URL here');
	}

	const onFilter = (fieldName: string, filter?: Filter) => {
		setFilter((_filter) => ({
			..._filter,
			...{ [fieldName]: filter },
		}));
	};

	const getFilterComponents = (entityName: string) => {
		// @todo this needs populating with filters from the address bar
		const options: any = {};
		const profitAndLossRowEntity = entityByName(entityName);

		return profitAndLossRowEntity.fields
			.map((field) => {
				const filterComponent: {
					[x in AdminUIFilterType]:
						| typeof TextFilter
						| typeof RelationshipFilter
						| typeof EnumFilter
						| typeof NumericFilter
						| typeof DateRangeFilter;
				} = {
					[AdminUIFilterType.TEXT]: TextFilter,
					[AdminUIFilterType.RELATIONSHIP]: RelationshipFilter,
					[AdminUIFilterType.ENUM]: EnumFilter,
					[AdminUIFilterType.NUMERIC]: NumericFilter,
					[AdminUIFilterType.DATE_RANGE]: DateRangeFilter,
				};
				return (
					field.filter?.type &&
					createElement(filterComponent[field.filter.type], {
						key: field.name,
						fieldName: field.name,
						entity: entity,
						selected: options[field.name],
						onChange: onFilter,
						resetCount: resetCount,
					})
				);
			})
			.filter((field): field is React.FunctionComponentElement<any> => !!field);
	};

	useEffect(() => {
		const filters = Object.entries(filter)
			.map(([_, _filter]) => _filter)
			.filter((_filter): _filter is Filter => _filter !== undefined);

		const { sort } = decodeSearchParams(search);
		navigate(
			routeFor({ entity, filters: filters && filters.length > 0 ? filters : undefined, sort })
		);
	}, [filter]);

	const filterComponents = getFilterComponents(entity);

	const clearAllFilters = () => {
		setFilter({});
		setResetCount((resetCount) => resetCount + 1);
	};

	return (
		<>
			{filterComponents.length > 0 && (
				<div className={styles.filterBarWrapper}>
					{iconBefore}
					{...filterComponents}
					<Button onClick={clearAllFilters}>Clear Filters</Button>
				</div>
			)}
		</>
	);
};
