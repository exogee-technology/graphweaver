import { BaseDataEntity, Entity } from '@exogee/graphweaver';
import { ID, Field, GraphQLEntity } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '../../decorators';

export interface ApiKeyStorage<R> extends BaseDataEntity {
	id: string;
	key: string;
	secret: string;
	revoked: boolean;
	roles: R[];
}

@ApplyAccessControlList({
	Everyone: {
		// By default everyone can read this can then be overridden by the APIKey auth method constructor
		read: true,
	},
})
@Entity('ApiKey', {
	adminUIOptions: {
		readonly: false,
		summaryField: 'key',
	},
	apiOptions: {
		excludeFromBuiltInWriteOperations: true,
	},
})
export class ApiKeyEntity<D extends BaseDataEntity, R> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@Field(() => String, {
		adminUIOptions: { readonly: true },
		apiOptions: { excludeFromBuiltInWriteOperations: true },
	})
	key!: string;

	@Field(() => Boolean, { nullable: true })
	revoked?: boolean;

	@Field(() => [String], { nullable: true })
	roles?: R[];
}
