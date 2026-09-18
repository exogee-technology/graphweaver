import { AdminUIFilterType, DetailPanelInputComponentOption, Entity } from '@exogee/graphweaver';
import { DateScalar, GraphQLJSON } from '@exogee/graphweaver-scalars';
import { GraphQLBigInt } from 'graphql-scalars';
import { myConnection } from '../database';
import { User } from './user';
import { Field, ManyToOne, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity('Task', {
	provider: new SqlDataProvider(() => Task, myConnection),
})
export class Task {
	@Field(() => GraphQLBigInt)
	id!: bigint;

	@Field(() => String, {
		description: 'Formatted text using Markdown, the Admin UI allows users to enter markdown text',
		adminUIOptions: {
			detailPanelInputComponent: DetailPanelInputComponentOption.MARKDOWN,
			hideInFilterBar: true,
		},
	})
	description!: string;

	@Field(() => Boolean, { column: 'completed' })
	isCompleted!: boolean;

	@ManyToOne(() => User, {
		column: 'user_id',
		adminUIOptions: {
			filterOptions: {
				orderBy: { username: 'ASC' },
				searchableFields: ['username'],
			},
		},
	})
	user!: User;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date, {
		adminUIOptions: {
			// I want my admin-ui users to not have to filter with time, just the date. The system should handle the time behind the scenes.
			filterType: AdminUIFilterType.DATE_RANGE,
		},
	})
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
}
