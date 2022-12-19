import { LoaderFunctionArgs, defer } from 'react-router-dom';
import { getEntity, getEntityPage } from '~/utils/data-loading';
import { SCHEMA_QUERY } from '~/utils/graphql';
import { client } from '~/apollo';
import { Schema } from '~/utils/use-schema';

const cleaningPattern = /[^a-zA-Z0-9]/g;

const {
	data: { result: schema },
} = await client.query<{ result: Schema }>({ query: SCHEMA_QUERY });

const entityByNameOrType = (entity: string | undefined) => {
	const cleaned = entity?.replaceAll(cleaningPattern, '');
	const selectedEntity = schema.entities.find((e: any) => e.name === cleaned);

	if (!selectedEntity) throw new Error(`Unknown entity ${entity}.`);

	return selectedEntity;
};

export const ListLoader = <T>({ params: { entity, id } }: LoaderFunctionArgs) =>
	defer({
		rows: getEntityPage<T>(entityByNameOrType(entity), [], entityByNameOrType, 1),
		detail: id ? getEntity<T>(entityByNameOrType(entity), entityByNameOrType, id) : undefined,
	});
