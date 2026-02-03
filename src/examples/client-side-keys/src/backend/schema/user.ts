import {
	Entity,
	Field,
	ID,
	RelationshipField,
	EntityMetadata,
	fromBackendEntity,
	graphweaverMetadata,
} from '@exogee/graphweaver';
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

graphweaverMetadata.addMutation({
	name: 'exampleMutation',
	getType: () => [User],
	resolver: async () => {
		const userEntity = graphweaverMetadata.getEntityByName('User') as EntityMetadata<User, OrmUser>;

		const user = await userEntity.provider.createOne({
			id: '1',
			username: 'example_mutation',
			email: 'example@test.com',
			tasks: [
				{
					id: '1',
					description: 'Wash your face with orange juice',
				},
				{
					id: '2',
					description: 'Clean your teeth with bubblegum',
				},
			],
		} as unknown as Partial<OrmUser>);
		return fromBackendEntity(userEntity, user);
	},
});
