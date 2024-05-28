import { BigIntType, Enum, EnumArrayType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ApiKey as ApiKeyStorage } from '@exogee/graphweaver-auth';
import { Roles } from '../../auth/roles';

@Entity({ tableName: 'api_key' })
export class ApiKey implements ApiKeyStorage<Roles> {
	@PrimaryKey({ type: new BigIntType('string') })
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
