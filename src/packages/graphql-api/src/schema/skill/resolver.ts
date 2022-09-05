import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/base-resolver';
import { Skill as OrmSkill } from '@exogee/database-entities';
import { RLSMikroBackendProvider } from '@exogee/rls-providers';
import { Resolver } from 'type-graphql';

import { Skill } from './entity';

@Resolver((of) => Skill)
@AuthorizedBaseFunctions()
export class SkillResolver extends createBaseResolver(
	Skill,
	new RLSMikroBackendProvider(OrmSkill, Skill)
) {}
