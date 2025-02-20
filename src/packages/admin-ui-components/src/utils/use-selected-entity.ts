import { useParams } from 'wouter';
import { useSchema } from './use-schema';

export const useSelectedEntity = () => {
	const { entity, id } = useParams();
	const { entityByName } = useSchema();

	if (!entity) return {};

	const selectedEntity = entityByName(entity);
	if (!selectedEntity) return {};

	return { selectedEntity, selectedEntityId: id };
};
