import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
	Button,
	clearSelect,
	decodeSearchParams,
	Filter,
	routeFor,
	Select,
	SelectOption,
	useSchema,
	useSelectedEntity,
} from '..';
import { EnumFilter, RelationshipFilter, TextFilter } from '../filters';

import styles from './styles.module.css';

type IndexedRef = Record<string, any>; //React.MutableRefObject<any>>;

export const FilterBar = ({ iconBefore }: { iconBefore?: ReactNode }) => {
	const { entity } = useParams();
	const [search, setSearch] = useSearchParams();
	console.log('DEBUG calling useSchema from FilterBar');
	const { entityByName, entityByType, enumByName, entities } = useSchema();
	const navigate = useNavigate();
	const [filter, setFilter] = useState<Filter>();

	if (!entity) {
		throw Error('Entity should be in URL here');
	}

	const entityType = entityByName(entity);

	// Use to control Clear button
	const refs = useRef<IndexedRef>({});
	// let refs: IndexedRef = {};
	let filters: JSX.Element[] = [];

	const tempSetAccountsFilters = () => {
		// refs = {
		// 	['code']: useRef(null),
		// 	['name']: useRef(null),
		// 	['type']: useRef(null),
		// 	['tenant']: useRef(null),
		// };
		return [
			<TextFilter
				key={'code'}
				fieldName={'code'}
				entity={entity}
				onSelect={onFilter}
				ref={(el) => (refs.current['code'] = el)} // refs['code']}
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

	const onFilter = (fieldName: string, filter?: Filter) => {
		// @todo: multiple filters
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

	useEffect(() => {
		// Preserve search params - update filter segment only
		const { sort } = decodeSearchParams(search);
		navigate(routeFor({ entity, filter, sort }));
	}, [filter]);

	// @todo: read schema to see what filters there are configured
	switch (entity) {
		case 'Account':
			filters = tempSetAccountsFilters();
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
			{...filters}
			<Button handleClick={clearAllFilters}>Clear Filters</Button>
		</div>
	);
};
