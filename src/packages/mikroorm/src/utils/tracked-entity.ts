import { BigIntType, PrimaryKey } from '@mikro-orm/core';

import { BaseEntity } from '../entities';

export abstract class TrackedEntity<T extends TrackedEntity<T>> extends BaseEntity {
	@PrimaryKey()
	id!: bigint;

	get relatedTrackedEntities():
		| {
				id: string;
				entityType: string;
		  }[]
		| undefined {
		return undefined;
	}
}
