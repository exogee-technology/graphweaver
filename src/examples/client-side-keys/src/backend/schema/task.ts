import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Tag } from './tag';
import { User } from './user';
import { Task as OrmTask } from '../entities';
import { connection } from '../database';

@Entity<Task>('Task', {
	provider: new MikroBackendProvider(OrmTask, connection, { backendDisplayName: 'PostgreSQL' }),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
export class Task {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@RelationshipField<Task>(() => User, { id: (entity) => entity.user?.id, nullable: true })
	user?: User;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag[];
}
