// In some cases when linking across from database to REST (or the other way around), it's very handy
// to flatten entities from:
//
// entity.createdBy = { id : 'whatever' }
//
// to
//
// entity.createdById = 'whatever'
//
// This allows us to treat them consistently from an API standpoint
// but actually store the values where they need to go.

import { BaseEntity } from '../entities/base-entity';
import { EntityConstructor } from '../entity-manager';

interface FieldOptions {
	from?: string;
}

export function ExternalIdField<T extends BaseEntity, U>(options: FieldOptions): any {
	return function (target: EntityConstructor<T>, propertyKey: keyof BaseEntity) {
		if (options?.from) {
			if (!target._externalEntityMap) {
				target._externalEntityMap = new Map<string, string>();
			}

			target._externalEntityMap.set(options.from, propertyKey);
		}
	};
}
