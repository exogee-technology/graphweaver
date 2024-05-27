import { BaseDataEntity, Field, GraphQLEntity, ID, Entity } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '../../decorators';

export interface CredentialStorage extends BaseDataEntity {
	id: string;
	username: string;
	password?: string;
}

@ApplyAccessControlList({
	Everyone: {
		// everyone can read their own credentials by default
		read: (context) => ({ id: context.user?.id }),
	},
})
@Entity('Credential', {
	adminUIOptions: { readonly: false },
	apiOptions: { excludeFromBuiltInWriteOperations: true },
})
export class Credential<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@Field(() => String, { adminUIOptions: { summaryField: true } })
	username!: string;
}
