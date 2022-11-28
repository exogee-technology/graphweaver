import { LoaderFunctionArgs, defer } from 'react-router-dom';
import { schema } from '~/utils/stub-data';
import { getEntity, getEntityPage } from '~/utils/data-loading';

const cleaningPattern = /[^a-zA-Z0-9]/g;

const entityByNameOrType = (entity: string | undefined) => {
	const cleaned = entity?.replaceAll(cleaningPattern, '');
	const selectedEntity = schema.find((e) => e.name === cleaned);

	console.log('entity', entity);
	console.log('cleaned', cleaned);
	console.log('schema', schema);
	console.log('selected', selectedEntity);

	if (!selectedEntity) throw new Error(`Unknown entity ${entity}.`);

	return selectedEntity;
};

export const ListLoader = <T>({ params: { entity, id } }: LoaderFunctionArgs) =>
	defer({
		rows: getEntityPage<T>(entityByNameOrType(entity), [], entityByNameOrType, 1),
		detail: id ? getEntity<T>(entityByNameOrType(entity), id) : undefined,
	});
