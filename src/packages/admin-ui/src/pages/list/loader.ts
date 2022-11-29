import { LoaderFunctionArgs, defer } from 'react-router-dom';
import { getEntity, getEntityPage } from '~/utils/data-loading';
import { SCHEMA_QUERY } from '~/utils/graphql';
import { client } from '~/apollo';

const cleaningPattern = /[^a-zA-Z0-9]/g;

const {
	data: { _graphweaver: schema },
} = await client.query({ query: SCHEMA_QUERY });

const entityByNameOrType = (entity: string | undefined) => {
	const cleaned = entity?.replaceAll(cleaningPattern, '');
	const selectedEntity = schema.find((e: any) => e.name === cleaned);

	if (!selectedEntity) throw new Error(`Unknown entity ${entity}.`);

	return selectedEntity;
};

export const ListLoader = <T>({ params: { entity, id } }: LoaderFunctionArgs) =>
	defer({
		rows: getEntityPage<T>(entityByNameOrType(entity), [], entityByNameOrType, 1),
		detail: id ? getEntity<T>(entityByNameOrType(entity), id) : undefined,
	});
