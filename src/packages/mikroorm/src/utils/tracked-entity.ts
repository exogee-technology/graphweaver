import { BigIntType, PrimaryKey } from '@mikro-orm/core';

import { BaseEntity } from '../entities';

export abstract class TrackedEntity<T extends TrackedEntity<T>> extends BaseEntity {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	get relatedTrackedEntities():
		| {
				id: string;
				entityType: string;
		  }[]
		| undefined {
		return undefined;
	}
}
