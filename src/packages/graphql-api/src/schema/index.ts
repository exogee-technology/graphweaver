import './common';
import { HobbyResolver } from './hobby';
import { UserResolver } from './user';
import { SkillResolver } from './skill';
import { DogResolver } from './dog';

// The Function type is the type that Type GraphQL expects, and it's fine
// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: [Function, ...Function[]] = [UserResolver, HobbyResolver, SkillResolver, DogResolver];
