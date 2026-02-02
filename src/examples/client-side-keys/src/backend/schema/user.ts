import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Task } from './task';
import { User as OrmUser } from '../entities';
import { connection } from '../database';

@Entity<User>('User', {
	provider: new MikroBackendProvider(OrmUser, connection, { backendDisplayName: 'PostgreSQL' }),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
export class User {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String)
	username!: string;

	@Field(() => String)
	email!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'user' })
	tasks!: Task[];
}
