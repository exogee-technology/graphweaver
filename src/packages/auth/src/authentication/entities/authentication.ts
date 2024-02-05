import { BaseDataEntity, GraphQLEntity, SummaryField } from '@exogee/graphweaver';
import { ObjectType, Field, ID } from 'type-graphql';
import { ApplyAccessControlList } from '../../decorators';
import { AccessControlList, AuthorizationContext } from '../../types';

export interface AuthenticationBaseEntity<T> {
	id: string;
	type: string;
	userId: string;
	data: T;
	createdAt: Date;
}

@ObjectType('Authentication')
export class Authentication<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	type!: string;

	@Field(() => ID)
	userId!: string;

	@Field(() => JSON)
	data!: D;

	@Field(() => Date)
	createdAt!: Date;
}

export const createAuthenticationEntity = <D extends BaseDataEntity>(
	acl?: AccessControlList<Authentication<D>, AuthorizationContext>
) => {
	const defaultAcl: AccessControlList<Authentication<D>, AuthorizationContext> = {
		Everyone: {
			// everyone can read their own Authentications by default
			read: (context) => ({ id: context.user?.id }),
		},
	};
	// Call the decorator to apply the ACL to the default entity above
	ApplyAccessControlList(acl ?? defaultAcl)(Authentication);
	// Return the entity with the ACL applied
	return Authentication;
};
