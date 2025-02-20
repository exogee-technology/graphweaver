import { useParams } from 'wouter';
import { useSchema, EntityList, MissingEntity } from '@exogee/graphweaver-admin-ui-components';

export const List = ({ children }: { children: React.ReactNode }) => {
	const { entity } = useParams();
	const { entityByName } = useSchema();

	if (!entity) throw new Error('There should always be an entity at this point.');

	if (!entityByName(entity)) {
		return <MissingEntity entity={entity} />;
	}

	return <EntityList>{children}</EntityList>;
};
