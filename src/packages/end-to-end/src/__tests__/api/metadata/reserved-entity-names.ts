import { Field, ID, Entity } from '@exogee/graphweaver';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

test('should correctly throw when a reserved entity name is chosen', () => {
	expect(() => {
		@Entity('GraphweaverMedia')
		class GraphweaverMedia {
			@Field(() => ID)
			id!: string;
		}
	}).toThrow(
		'The entity name "GraphweaverMedia" is reserved for internal use by Graphweaver. Please use a different name.'
	);
});

test('should correctly throw when a reserved entity name is chosen without specifying the name in the @Entity decorator args', () => {
	expect(() => {
		@Entity({})
		class GraphweaverMedia {
			@Field(() => ID)
			id!: string;
		}
	}).toThrow(
		'The entity name "GraphweaverMedia" is reserved for internal use by Graphweaver. Please use a different name.'
	);
});

test('should not throw when a reserved entity name is chosen and the internalOptions.ignoreReservedEntityNames option is set', () => {
	expect(() => {
		@Entity('GraphweaverMedia', { graphweaverInternalOptions: { ignoreReservedEntityNames: true } })
		class GraphweaverMedia {
			@Field(() => ID)
			id!: string;
		}
	}).not.toThrow(
		'The entity name "GraphweaverMedia" is reserved for internal use by Graphweaver. Please use a different name.'
	);
});
