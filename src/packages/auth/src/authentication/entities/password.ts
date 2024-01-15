import {
	BaseDataEntity,
	Field,
	GraphQLEntity,
	GraphqlEntityType,
	ID,
	ObjectType,
	ReadOnly,
	SummaryField,
} from '@exogee/graphweaver';
import { AccessControlList, AuthorizationContext } from '../../types';
import { ApplyAccessControlList } from '../../decorators';

export interface PasswordStorage {
	id: string;
	username: string;
	password?: string;
}

export const createCredentialEntity = <D extends BaseDataEntity>(
	acl?: AccessControlList<Credential, AuthorizationContext>
) => {
	@ApplyAccessControlList(acl ?? {})
	@ReadOnly()
	@ObjectType('Credential')
	class Credential extends GraphQLEntity<D> {
		public dataEntity!: D;

		@Field(() => ID)
		id!: string;

		@SummaryField()
		@Field(() => String)
		username!: string;
	}

	return Credential as GraphqlEntityType<Credential, D>;
};
