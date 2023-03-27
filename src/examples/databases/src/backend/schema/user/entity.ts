import {
	GraphQLEntity,
	AdminUISettings,
	BaseLoaders,
	SummaryField,
	AdminUIFilterType,
} from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';

import { User as OrmUser } from '../../entities';
import { Task } from '../task';

@ObjectType('User')
export class User extends GraphQLEntity<OrmUser> {
	public dataEntity!: OrmUser;

	@Field(() => ID)
	id!: string;

	@AdminUISettings({
		filter: {
			type: AdminUIFilterType.TEXT,
		},
	})
	@SummaryField()
	@Field(() => String)
	username!: string;

	@AdminUISettings({
		filter: {
			type: AdminUIFilterType.TEXT,
		},
	})
	@Field(() => String)
	email!: string;
}
