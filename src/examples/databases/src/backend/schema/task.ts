import {
	DetailPanelInputComponentOption,
	Entity,
	Field,
	RelationshipField,
} from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { DateScalar, GraphQLJSON } from '@exogee/graphweaver-scalars';
import { GraphQLBigInt } from 'graphql-scalars';
import { myConnection } from '../database';
import { Task as OrmTask } from '../entities';
import { User } from './user';

@Entity('Task', {
	provider: new MikroBackendProvider(OrmTask, myConnection),
})
export class Task {
	@Field(() => GraphQLBigInt)
	id!: bigint;

	@Field(() => String, {
		description: 'Formatted text using Markdown, the Admin UI allows users to enter markdown text',
		adminUIOptions: {
			detailPanelInputComponent: DetailPanelInputComponentOption.MARKDOWN,
		},
	})
	description!: string;

	@Field(() => Boolean)
	isCompleted!: boolean;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => DateScalar, { nullable: true })
	dueAt?: Date;

	// Example of a field resolver using a json type
	@Field(() => GraphQLJSON, { nullable: true, readonly: true })
	meta(task: Task) {
		return {
			id: task.id,
			description: task.description,
		};
	}

	@RelationshipField<OrmTask>(() => User, { id: (entity) => entity.userId })
	user!: User;
}
