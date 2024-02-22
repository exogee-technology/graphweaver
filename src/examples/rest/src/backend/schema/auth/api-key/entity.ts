import {
	AccessControlList,
	ApplyAccessControlList,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import {
	ID,
	ObjectType,
	Field,
	SummaryField,
	ReadOnly,
	registerEnumType,
	GraphQLEntity,
	ReadOnlyProperty,
} from '@exogee/graphweaver';

import { Roles } from '../../../auth/roles';
import { ApiKey as OrmApiKey } from '../../../entities';

const acl: AccessControlList<ApiKey, AuthorizationContext> = {
	DARK_SIDE: {
		// Dark side user role can perform operations on any api keys
		all: true,
	},
};

registerEnumType(Roles, {
	name: 'Roles',
});

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

	@Field(() => Boolean, { nullable: true })
	revoked?: boolean;

	@Field(() => [Roles], { nullable: true })
	roles?: Roles[];
}
