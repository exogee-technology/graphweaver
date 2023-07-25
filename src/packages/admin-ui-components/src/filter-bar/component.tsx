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
	DateRangeFilterType,
	EnumFilter,
	NumericFilter,
	RelationshipFilter,
	RelationshipFilterType,
	TextFilter,
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

		// @todo - currently the filters are not fitting on the screen
		// we plan to redo this filter bar so that it is a drop down
		// for now the workaround is to reduce the number of filters to 5
		const showOnlyFiveFilters = rowEntity.fields.length > 5 ? 5 : rowEntity.fields.length;
		return rowEntity.fields.slice(0, showOnlyFiveFilters).map((field) => {
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
						initialFilter: filter[field.name] as Filter<string> | undefined,
					});
				case AdminUIFilterType.RELATIONSHIP:
					return createElement(RelationshipFilter, {
						...options,
						initialFilter: filter[field.name] as Filter<RelationshipFilterType> | undefined,
					});
				case AdminUIFilterType.ENUM:
					return createElement(EnumFilter, {
						...options,
						initialFilter: filter[field.name] as Filter<string> | undefined,
					});
				case AdminUIFilterType.NUMERIC:
					return createElement(NumericFilter, {
						...options,
						initialFilter: filter[field.name] as Filter<number> | undefined,
					});
				case AdminUIFilterType.DATE_RANGE:
					return createElement(DateRangeFilter, {
						...options,
						initialFilter: filter[field.name] as Filter<DateRangeFilterType> | undefined,
					});
			}
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
