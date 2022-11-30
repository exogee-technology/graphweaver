import { useParams } from 'react-router-dom';
import { useSchema } from './use-schema';

export const useSelectedEntity = () => {
	const { entity, id } = useParams();
	const { entityByName } = useSchema();

	if (!entity) return {};

	const selectedEntity = entityByName(entity);
	if (!selectedEntity) throw new Error(`Unknown entity ${entity}`);

	return { selectedEntity, selectedEntityId: id };
};
