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
	isCollection: (fieldName: string, dataField: any) => boolean;
	isReference: (fieldName: string, dataField: any) => boolean;
}

@ReadOnly({ adminUI: false, backend: true })
@ObjectType('Credential')
export class Credential extends GraphQLEntity<PasswordStorage> {
	public dataEntity!: PasswordStorage;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	username!: string;
}

export const createCredentialEntity = (
	acl?: AccessControlList<Credential, AuthorizationContext>
) => {
	ApplyAccessControlList(acl ?? {})(Credential);
	return Credential;
};
