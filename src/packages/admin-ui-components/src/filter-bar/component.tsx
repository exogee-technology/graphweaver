import {
	ReactNode,
	useEffect,
	useReducer,
	useState,
	createElement,
	FunctionComponent,
} from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../button';
import {
	AdminUIFilterType,
	decodeSearchParams,
	FieldFilter,
	Filter,
	routeFor,
	useSchema,
} from '../utils';
import {
	DateRangeFilter,
	DateRangeFilterProps,
	DateRangeFilterType,
	EnumFilter,
	EnumFilterProps,
	NumericFilter,
	NumericFilterProps,
	RelationshipFilter,
	RelationshipFilterProps,
	RelationshipFilterType,
	TextFilter,
	TextFilterProps,
} from '../filters';

import styles from './styles.module.css';

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity } = useParams();
	const [resetCount, setResetCount] = useState(0);
	const [search] = useSearchParams();
	const { entityByName } = useSchema();
	const navigate = useNavigate();
	const searchParams = decodeSearchParams(search);
	const [filter, setFilter] = useState<FieldFilter>(searchParams.filters ?? {});

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
		const rowEntity = entityByName(entityName);

		return rowEntity.fields.map((field) => {
			const filterComponent = {
				[AdminUIFilterType.TEXT]: TextFilter,
				[AdminUIFilterType.RELATIONSHIP]: RelationshipFilter,
				[AdminUIFilterType.ENUM]: EnumFilter,
				[AdminUIFilterType.NUMERIC]: NumericFilter,
				[AdminUIFilterType.DATE_RANGE]: DateRangeFilter,
			};
			return (
				field.filter?.type &&
				createElement(
					filterComponent[field.filter.type] as FunctionComponent<
						| NumericFilterProps
						| TextFilterProps
						| DateRangeFilterProps
						| EnumFilterProps
						| RelationshipFilterProps
					>,
					{
						key: field.name,
						fieldName: field.name,
						entity: entity,
						initialFilter: filter[field.name] as
							| (Filter<number | undefined> &
									Filter<string> &
									Filter<DateRangeFilterType> &
									Filter<RelationshipFilterType>)
							| undefined,
						onChange: onFilter,
						resetCount: resetCount,
					}
				)
			);
		});
	};

	useEffect(() => {
		const { sort } = decodeSearchParams(search);
		navigate(
			routeFor({ entity, filters: Object.keys(filter).length > 0 ? filter : undefined, sort })
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
