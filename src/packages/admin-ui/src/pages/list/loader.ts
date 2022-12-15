import { LoaderFunctionArgs, defer } from 'react-router-dom';
import {
	apolloClient,
	getEntity,
	getEntityPage,
	Schema,
	SCHEMA_QUERY,
} from '@exogee/graphweaver-admin-ui-components';

const cleaningPattern = /[^a-zA-Z0-9]/g;

// Without the any, we get:
// error TS2742: The inferred type of 'ListLoader' cannot be named without a reference to
// '.pnpm/@remix-run+router@1.0.3/node_modules/@remix-run/router/dist/utils'. This is likely
// not portable. A type annotation is necessary.
//
// However users are not expected to import this anyway. React router does not export
// the DeferredData type, so we'd have to duplicate the type declaration, which is just
// not necessary. So we'll type it any for now.
type ListLoaderType = ({ params: { entity, id } }: LoaderFunctionArgs) => any;

export const ListLoader: ListLoaderType = async <T>({
	params: { entity, id },
}: LoaderFunctionArgs) => {
	const {
		data: { result: schema },
	} = await apolloClient.query<{ result: Schema }>({ query: SCHEMA_QUERY });

	const entityByNameOrType = (entity: string | undefined) => {
		const cleaned = entity?.replaceAll(cleaningPattern, '');
		const selectedEntity = schema.entities.find((e: any) => e.name === cleaned);

		if (!selectedEntity) throw new Error(`Unknown entity ${entity}.`);

		return selectedEntity;
	};

	return defer({
		rows: getEntityPage<T>(entityByNameOrType(entity), [], entityByNameOrType, 1),
		detail: id ? getEntity<T>(entityByNameOrType(entity), id) : undefined,
	});
};
