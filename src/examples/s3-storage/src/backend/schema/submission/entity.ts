import { GraphQLEntity, Field, ID, ObjectType } from '@exogee/graphweaver';

import { Submission as OrmSubmission } from '../../entities';

@ObjectType('Submission')
export class Submission extends GraphQLEntity<OrmSubmission> {
	public dataEntity!: OrmSubmission;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	url!: string;
}
