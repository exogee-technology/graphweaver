import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
	EntityTable,
	useSchema,
	PAGE_SIZE,
	decodeSearchParams,
	ListToolBar,
	TableRowItem,
	routeFor,
	RequestRefetchOptions,
	Header,
	ExportModal,
	getOrderByQuery,
	EntityList,
	MissingEntity,
} from '@exogee/graphweaver-admin-ui-components';

import { queryForEntityPage } from './graphql';

export const ListWithSelectedEntity = () => {
	const { entity, id } = useParams();
	if (!entity) throw new Error('There should always be an entity at this point.');
	const navigate = useNavigate();
	const [search] = useSearchParams();
	const { entityByName } = useSchema();
	const [showExportModal, setShowExportModal] = useState(false);
	const { sort, page, filters } = decodeSearchParams(search);

	const { primaryKeyField, fields } = entityByName(entity);

	const queryVariables = {
		pagination: {
			offset: Math.max(page - 1, 0) * PAGE_SIZE,
			limit: PAGE_SIZE,
			orderBy: getOrderByQuery({ primaryKeyField, sort }),
		},
		...(filters ? { filter: filters } : {}),
	};

	const { data, loading, error, fetchMore } = useQuery<{
		result: TableRowItem[];
		aggregate?: { count: number };
	}>(queryForEntityPage(entity, entityByName), {
		variables: queryVariables,
		notifyOnNetworkStatusChange: true,
	});

	const initialLoading = !!(!data?.result && loading);
	const loadingNext = !!(data?.result && loading);

	useEffect(() => {
		fetchMore({
			variables: queryVariables,
		});
	}, [page, JSON.stringify(filters), JSON.stringify(sort)]);

	if (entity === 'Trace') {
		return <EntityList />;
	}

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
		type OverrideKey = keyof typeof row;
		const overrides: { [k in OverrideKey]?: unknown } = {};

		for (const key in row) {
			const field = fields.find((field) => field.name === key);
			if (field?.type === 'JSON') {
				// We have an array let's stringify it so it can be displayed in the table
				overrides[key as OverrideKey] = JSON.stringify(row[key as OverrideKey]);
			} else if (field?.type === 'Boolean') {
				overrides[key as OverrideKey] = `${row[key as OverrideKey]}`;
			}
		}
		// override any arrays we have found
		return { ...row, ...overrides } as typeof row;
	});

	if (!entityByName(entity)) {
		// We need to show the 404 page
		return <MissingEntity entity={entity} />;
	}

	return (
		<>
			<Header>
				<ListToolBar
					count={data?.aggregate?.count}
					onExportToCSV={() => setShowExportModal(true)}
				/>
			</Header>

			<EntityTable
				rows={rows}
				orderBy={sort ?? []}
				requestRefetch={requestRefetch}
				loading={initialLoading}
				loadingNext={loadingNext}
				error={error}
			/>
			<Outlet />
			{showExportModal ? (
				<ExportModal closeModal={() => setShowExportModal(false)} sort={sort} filters={filters} />
			) : null}
		</>
	);
};

export const List = () => {
	const { entity } = useParams();
	const { entityByName } = useSchema();

	if (!entity) throw new Error('There should always be an entity at this point.');

	if (!entityByName(entity)) {
		return <MissingEntity entity={entity} />;
	}

	return <ListWithSelectedEntity />;
};
