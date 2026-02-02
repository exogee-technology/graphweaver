import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Task } from './task';
import { Tag as OrmTag } from '../entities';
import { connection } from '../database';

@Entity<Tag>('Tag', {
	provider: new MikroBackendProvider(OrmTag, connection, { backendDisplayName: 'PostgreSQL' }),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
export class Tag {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'tags' })
	tasks!: Task[];
}
