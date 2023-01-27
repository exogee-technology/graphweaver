import { LoaderFunctionArgs, defer } from 'react-router-dom';
import {
	apolloClient,
	getEntity,
	getEntityPage,
	Schema,
	SCHEMA_QUERY,
} from '@exogee/graphweaver-admin-ui-components';
import { SortColumn } from 'react-data-grid';

const cleaningPattern = /[^a-zA-Z0-9]/g;

const {
	data: { result: schema },
} = await apolloClient.query<{ result: Schema }>({ query: SCHEMA_QUERY });

const entityByNameOrType = (entity: string | undefined) => {
	const cleaned = entity?.replaceAll(cleaningPattern, '');
	const selectedEntity = schema.entities.find((e: any) => e.name === cleaned);

	if (!selectedEntity) throw new Error(`Unknown entity ${entity}.`);

	return selectedEntity;
};

// Without the any, we get:
// error TS2742: The inferred type of 'ListLoader' cannot be named without a reference to
// '.pnpm/@remix-run+router@1.0.3/node_modules/@remix-run/router/dist/utils'. This is likely
// not portable. A type annotation is necessary.
//
// However users are not expected to import this anyway. React router does not export
// the DeferredData type, so we'd have to duplicate the type declaration, which is just
// not necessary. So we'll type it any for now.
type ListLoaderType = ({ params: { entity, id } }: LoaderFunctionArgs) => any;

/** @deprecated see use... hooks below */
export const ListLoader: ListLoaderType = <T>({ params: { entity, id } }: LoaderFunctionArgs) =>
	defer({
		rows: getEntityPage<T>(entityByNameOrType(entity), [], entityByNameOrType, 1),
		detail: id ? getEntity<T>(entityByNameOrType(entity), id) : undefined,
	});

export const fetchList = <T>(entity: string, sortColumns?: SortColumn[], page?: number) => {
	// Enum field sort - ApolloQuery throws an error if we try to sort by such fields so
	// will have to do this on the front end
	// TODO: multi-column sort
	const schemaEntity = entityByNameOrType(entity);
	const apolloSortColumns = sortColumns?.reduce((arr: SortColumn[], col) => {
		const field = schemaEntity.fields.find((f) => f.name === col.columnKey);
		const enumField = schema.enums.find((e) => e.name === field?.type);
		if (enumField) {
			// Remove from sortColumns to avoid Apollo exception
			return arr;
		}
		arr.push(col);
		return arr;
	}, []);
	const result = getEntityPage<T>(
		entityByNameOrType(entity),
		apolloSortColumns || [],
		entityByNameOrType,
		page ?? 1
	);

	return result;
};

export const fetchEntity = <T>(entity: string, id?: string) => {
	const detail = id ? getEntity<T>(entityByNameOrType(entity), id) : undefined;

	return detail;
};
