import { Entity } from '@exogee/graphweaver';
import { ID, Field } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '../../decorators';

@ApplyAccessControlList({
	Everyone: {
		// By default everyone can read this can then be overridden by the APIKey auth method constructor
		read: true,
	},
})
@Entity('ApiKey', {
	adminUIOptions: {
		readonly: false,
	},
	apiOptions: {
		excludeFromBuiltInWriteOperations: true,
	},
})
export class ApiKeyEntity<R> {
	@Field(() => ID)
	id!: string;

	@Field(() => String, {
		adminUIOptions: { readonly: true, summaryField: true },
		apiOptions: { excludeFromBuiltInWriteOperations: true },
	})
	key!: string;

	// There's no @Field decorator here intentionally. We don't want to expose
	// the secret in the API. It's only accessible to our backend code.
	secret!: string;

	@Field(() => Boolean, { nullable: true })
	revoked?: boolean;

	@Field(() => [String], { nullable: true })
	roles?: R[];
}
