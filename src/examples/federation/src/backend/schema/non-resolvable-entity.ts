import { Entity, Field, ID } from '@exogee/graphweaver';

@Entity('NonResolvableEntity', {
	apiOptions: { excludeFromBuiltInOperations: true, resolvableViaFederation: false },
})
export class NonResolvableEntity {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;
}
