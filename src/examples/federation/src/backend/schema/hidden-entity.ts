import { Entity, Field, ID } from '@exogee/graphweaver';

@Entity('HiddenEntity', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class HiddenEntity {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String, { nullable: true })
	name?: string;
}
