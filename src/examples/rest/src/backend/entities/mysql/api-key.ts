import { BigIntType, Enum, EnumArrayType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { ApiKeyStorage } from '@exogee/graphweaver-auth';
import { Roles } from '../../auth/roles';

@Entity({ tableName: 'api_key' })
export class ApiKey extends BaseEntity implements ApiKeyStorage {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String, fieldName: 'api_key' })
	key!: string;

	@Property({ type: String })
	secret!: string;

	@Property({ type: Boolean, default: false })
	revoked!: boolean;

	@Enum({ type: EnumArrayType, items: () => Roles, array: true, default: [] })
	roles!: Roles[];
}
