import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { RLSMikroBackendProvider } from '@exogee/graphweaver-rls';
import { Resolver } from 'type-graphql';

import { Skill as OrmSkill } from '../../entities';
import { Skill } from './entity';

@Resolver((of) => Skill)
@AuthorizedBaseFunctions()
export class SkillResolver extends createBaseResolver(
	Skill,
	new RLSMikroBackendProvider(OrmSkill, Skill)
) {}
