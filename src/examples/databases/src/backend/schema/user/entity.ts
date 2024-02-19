import {
	GraphQLEntity,
	SummaryField,
	Field,
	ID,
	ObjectType,
	AdminUISettings,
} from '@exogee/graphweaver';

import { User as OrmUser } from '../../entities';

@AdminUISettings<User, OrmUser>({
	defaultFilter: {
		deleted: { deleted: false },
	},
} as any)
@ObjectType('User')
export class User extends GraphQLEntity<OrmUser> {
	public dataEntity!: OrmUser;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	username!: string;

	@Field(() => String)
	email!: string;

	@Field(() => Boolean)
	deleted!: boolean;
}
