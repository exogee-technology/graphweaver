import { Field, ID, Entity, graphweaverMetadata } from '@exogee/graphweaver';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

test('should correctly discover the misuse of an entity field decorator on a non-entity', async () => {
	@Entity('User')
	class User {
		@Field(() => ID)
		id!: string;

		@Field(() => String)
		name!: string;
	}

	class Other {
		@Field(() => String)
		one!: string;

		two!: string;

		@Field(() => String)
		three!: string;
	}
	expect(graphweaverMetadata.validateEntities).toThrow(
		`The entity 'Other' is missing the @Entity() decorator from Graphweaver. This is likely because a field was mistakenly decorated with a GraphQL decorator when it is not a GraphQL entity. Fields on this entity are: 'one', 'three'. If this is not a full list of all of the fields on the entity, examine the decorators on these fields closely and make sure they are in the correct files. Are they on a data source entity instead of the GraphQL entity?`
	);
});
