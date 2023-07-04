import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
	DetailPanel,
	Table,
	useSchema,
	PAGE_SIZE,
	decodeSearchParams,
	ToolBar,
	FieldFilter,
	Filter,
	TableRowItem,
	routeFor,
	RequestRefetchOptions,
} from '@exogee/graphweaver-admin-ui-components';
import '@exogee/graphweaver-admin-ui-components/lib/index.css';
import { queryForEntityPage } from './graphql';

const andFilters = (filters: FieldFilter) => {
	const filter = Object.entries(filters)
		.map(([_, _filter]) => _filter)
		.filter((_filter): _filter is Filter => _filter !== undefined);

	if (filter.length === 0) return undefined;
	return { _and: filter };
};

export const ListToolBar = () => {
	const { entity } = useParams();
	const { entityByName } = useSchema();
	return (
		<ToolBar
			title={entity}
			subtitle={
				entity && entityByName(entity) ? `From ${entityByName(entity).backendId}` : undefined
			}
		/>
	);
};

export const List = () => {
	const { entity, id } = useParams();
	if (!entity) throw new Error('There should always be an entity at this point.');

	const navigate = useNavigate();
	const [search] = useSearchParams();
	const { entityByName } = useSchema();

	const { sort, page, filters } = decodeSearchParams(search);
	const orderBy = {
		...(sort
			? sort.reduce((acc, { field, direction }) => ({ ...acc, [field]: direction }), {})
			: { id: 'ASC' }),
	};

	const queryVariables = {
		pagination: {
			offset: Math.max(page - 1, 0) * PAGE_SIZE,
			limit: PAGE_SIZE,
			orderBy,
		},
		...(filters ? { filter: andFilters(filters) } : {}),
	};

	const { data, loading, error, fetchMore } = useQuery<{ result: TableRowItem[] }>(
		queryForEntityPage(entity, entityByName),
		{
			variables: queryVariables,
			notifyOnNetworkStatusChange: true,
		}
	);

	const initialLoading = !!(!data?.result && loading);
	const loadingNext = !!(data?.result && loading);

	useEffect(() => {
		fetchMore({
			variables: queryVariables,
		});
	}, [page, JSON.stringify(filters), JSON.stringify(sort)]);

	const requestRefetch = (state: Partial<RequestRefetchOptions>) => {
		state.sortFields ? requestSort(state) : incrementPage();
	};

	const requestSort = (state: Partial<RequestRefetchOptions>) => {
		navigate(routeFor({ entity, id, sort: state.sortFields, filters }));
	};

	const incrementPage = async () => {
		const isNextPage = !((data?.result.length ?? 0) % PAGE_SIZE);
		if (isNextPage) {
			const nextPage = (data?.result.length ?? 0) / PAGE_SIZE + 1;
			navigate(routeFor({ entity, id, sort, filters, page: nextPage }));
		}
	};

	// If we have an array as a value then we need to convert this to a string to display in the table
	const rows = (data?.result ?? []).map((row) => {
		// Hold any overrides we need to apply
		const overrides: { [k in keyof typeof row]?: unknown } = {};
		for (const key in row) {
			if (typeof row[key as keyof typeof row] === 'object') {
				// We have an array let's stringify it so it can be displayed in the table
				overrides[key as keyof typeof row] = JSON.stringify(row[key as keyof typeof row]);
			}
		}
		// override any arrays we have found
		return { ...row, ...overrides } as typeof row;
	});

	return (
		<>
			<Table
				rows={rows}
				orderBy={sort ?? []}
				requestRefetch={requestRefetch}
				loading={initialLoading}
				loadingNext={loadingNext}
				error={error}
			/>
			{id && <DetailPanel />}
		</>
	);
};
