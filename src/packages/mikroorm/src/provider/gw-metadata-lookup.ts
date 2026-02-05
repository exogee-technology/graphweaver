import type { EntityName } from '@mikro-orm/core';
import { EntityMetadata, graphweaverMetadata } from '@exogee/graphweaver';
import { MikroBackendProvider } from './provider';

const ormToGwMetadata = new Map<Function, EntityMetadata>();
let cacheBuilt = false;

/**
 * Finds the Graphweaver entity metadata for a given MikroORM entity class.
 *
 * This is needed because the MikroORM entity class name (e.g. 'OrmUser') may differ
 * from the Graphweaver entity name (e.g. 'User'), so a direct name-based lookup won't work.
 *
 * Lazily builds a reverse lookup map on first call by iterating all registered
 * Graphweaver entities and matching on their provider's ORM entity type.
 *
 * Accepts EntityName<T> (the same type as propertyMetadata.entity()) but can only
 * perform the lookup when a class constructor is provided.
 */
export const getGwMetadataForOrmClass = <T>(ormClass: EntityName<T>): EntityMetadata | undefined => {

	// We can only match by class constructor.
	if (typeof ormClass !== 'function') return undefined;

	if (!cacheBuilt) {
		for (const entity of graphweaverMetadata.entities()) {
			if (
				entity.provider instanceof MikroBackendProvider &&
				entity.provider.entityType
			) {
				ormToGwMetadata.set(entity.provider.entityType, entity);
			}
		}
		cacheBuilt = true;
	}
	return ormToGwMetadata.get(ormClass);
};
