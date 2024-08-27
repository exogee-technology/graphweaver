import { Field, ID, Entity, RelationshipField } from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import { RestBackendProvider } from '@exogee/graphweaver-rest';
import { urlToIdTransform } from '../utils';
import { Task } from './task';

const provider = new RestBackendProvider({
	baseUrl: 'https://swapi.info/api',
	defaultPath: 'people',
	fieldConfig: { url: { transform: urlToIdTransform } },
});

const acl: AccessControlList<User, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform operations on their own accounts
		all: (context) => ({ url: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tasks
		all: true,
	},
};

@ApplyAccessControlList(acl)
@Entity('User', {
	provider,
	adminUIOptions: { readonly: true },
	apiOptions: { excludeFromBuiltInWriteOperations: true },
})
export class User {
	@Field(() => ID, { primaryKeyField: true })
	url!: string;

	@Field(() => String)
	name!: string;

	@RelationshipField(() => [Task], { relatedField: 'userId' })
	tasks!: Task[];
}
