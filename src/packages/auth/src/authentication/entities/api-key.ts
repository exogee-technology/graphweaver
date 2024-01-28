import {
	BaseDataEntity,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	ReadOnly,
	SummaryField,
} from '@exogee/graphweaver';
import { AccessControlList, AuthorizationContext } from '../../types';
import { ApplyAccessControlList } from '../../decorators';

export interface ApiKeyStorage extends BaseDataEntity {
	id: string;
	key: string;
	secret?: string;
}

@ReadOnly({ adminUI: false, backend: true })
@ObjectType('ApiKey')
export class ApiKey<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	key!: string;
}

export const createApiKeyEntity = <D extends BaseDataEntity>(
	acl?: AccessControlList<ApiKey<D>, AuthorizationContext>
) => {
	// No access is given by default
	const defaultAcl: AccessControlList<ApiKey<D>, AuthorizationContext> = {};
	// Call the decorator to apply the ACL to the default entity above
	ApplyAccessControlList(acl ?? defaultAcl)(ApiKey);
	// Return the entity with the ACL applied
	return ApiKey;
};
