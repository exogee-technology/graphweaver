import {
	AccessControlList,
	ApiKeyStorage,
	ApplyAccessControlList,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import {
	ID,
	ObjectType,
	Field,
	SummaryField,
	ReadOnly,
	GraphQLEntity,
	ReadOnlyProperty,
} from '@exogee/graphweaver';

import { ApiKey as OrmApiKey } from '../../../entities';

const acl: AccessControlList<ApiKey, AuthorizationContext> = {
	DARK_SIDE: {
		// Dark side user role can perform operations on any api keys
		all: true,
	},
};

@ReadOnly({ adminUI: false, backend: true })
@ApplyAccessControlList(acl)
@ObjectType('ApiKey')
export class ApiKey extends GraphQLEntity<OrmApiKey> {
	public dataEntity!: OrmApiKey;

	@Field(() => ID)
	id!: string;

	@ReadOnlyProperty({ adminUI: true, backend: true })
	@SummaryField()
	@Field(() => String)
	key!: string;

	@Field(() => Boolean)
	revoked!: boolean;

	@Field(() => [String], { nullable: true })
	roles?: string[];
}
