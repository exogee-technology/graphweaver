import { BigIntType, PrimaryKey } from '@mikro-orm/core';
export abstract class TrackedEntity<_T extends TrackedEntity<_T>> {
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
