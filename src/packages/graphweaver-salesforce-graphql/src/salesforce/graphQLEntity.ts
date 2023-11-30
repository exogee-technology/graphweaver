import { Field, ID, ObjectType, Root } from 'type-graphql';
import { GraphQLEntity } from '@exogee/graphweaver';

import { SalesforceAccountBackendEntity } from './backendEntity';

@ObjectType('SalesforceAccount')
export class SalesforceAccount extends GraphQLEntity<SalesforceAccountBackendEntity> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;
}
