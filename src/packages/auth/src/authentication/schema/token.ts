import { GraphQLEntity, SummaryField } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';
import { AuthToken } from '../base-auth-provider';

@ObjectType('User')
export class Token extends GraphQLEntity<AuthToken> {
	public dataEntity!: AuthToken;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	name!: string;
}
