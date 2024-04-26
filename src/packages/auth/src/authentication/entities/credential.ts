import { BaseDataEntity, Field, GraphQLEntity, ID, Entity } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '../../decorators';

export interface CredentialStorage {
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
	adminUIOptions: {
		readonly: false,
		summaryField: 'username',
	},
	apiOptions: {
		readonly: true,
		excludeFromBuiltInOperations: true,
	},
})
export class Credential<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	username!: string;
}
