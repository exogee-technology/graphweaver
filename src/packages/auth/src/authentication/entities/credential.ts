import { BaseDataEntity, Field, GraphQLEntity, GraphQLID, Entity } from '@exogee/graphweaver';
import { AccessControlList, AuthorizationContext } from '../../types';
import { ApplyAccessControlList } from '../../decorators';

export interface CredentialStorage {
	id: string;
	username: string;
	password?: string;
}

@Entity('Credential', {
	adminUIOptions: {
		readonly: false,
		summaryField: 'username',
	},
	apiOptions: {
		readonly: true,
	},
})
export class Credential<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => GraphQLID)
	id!: string;

	@Field(() => String)
	username!: string;
}

export const createCredentialEntity = <D extends BaseDataEntity>(
	acl?: AccessControlList<Credential<D>, AuthorizationContext>
) => {
	const defaultAcl: AccessControlList<Credential<D>, AuthorizationContext> = {
		Everyone: {
			// everyone can read their own credentials by default
			read: (context) => ({ id: context.user?.id }),
		},
	};
	// Call the decorator to apply the ACL to the default entity above
	ApplyAccessControlList(acl ?? defaultAcl)(Credential);
	// Return the entity with the ACL applied
	return Credential;
};
