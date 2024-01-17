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

@ReadOnly({ adminUI: false, backend: true })
@ObjectType('Credential')
export class Credential<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	username!: string;
}

export const createCredentialEntity = <D extends BaseDataEntity>(
	acl?: AccessControlList<Credential<D>, AuthorizationContext>
) => {
	ApplyAccessControlList(acl ?? {})(Credential);
	return Credential;
};
