import { Field, ID, ObjectType, Root } from 'type-graphql';
import { GraphQLEntity, ReadOnly } from '@exogee/graphweaver';

import { SalesforceAccountBackendEntity } from './backendEntity';

@ObjectType('SalesforceAccount')
export class SalesforceAccount extends GraphQLEntity<SalesforceAccountBackendEntity> {
	@Field(() => ID)
	id!: string;

	@ReadOnly()
	@Field(() => String)
	async name(@Root() dataEntity: SalesforceAccountBackendEntity) {
		return dataEntity.name;
	}
}
