import { buildSchemaSync } from 'type-graphql';

import { HobbyResolver } from './hobby';
import { UserResolver } from './user';
import { SkillResolver } from './skill';
import { DogResolver } from './dog';
import { BreederResolver } from './breeder';
import { UserDogResolver } from './user-dog';

// The Function type is the type that Type GraphQL expects, and it's fine
// eslint-disable-next-line @typescript-eslint/ban-types
export const schema = buildSchemaSync({
	resolvers: [
		HobbyResolver,
		UserResolver,
		SkillResolver,
		DogResolver,
		BreederResolver,
		UserDogResolver,
	],
	authChecker: () => true,
});
