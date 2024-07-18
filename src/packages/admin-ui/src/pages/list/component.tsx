import { useParams } from 'react-router-dom';
import { useSchema, EntityList, MissingEntity } from '@exogee/graphweaver-admin-ui-components';

export const List = () => {
	const { entity } = useParams();
	const { entityByName } = useSchema();

	if (!entity) throw new Error('There should always be an entity at this point.');

	if (!entityByName(entity)) {
		return <MissingEntity entity={entity} />;
	}

	return <EntityList />;
};
