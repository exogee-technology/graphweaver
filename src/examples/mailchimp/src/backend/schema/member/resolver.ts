import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { Member } from './entity';
import { ClientOptions } from '../index';
import { MemberDataEntity } from '../../entities/member';
import { createMemberProvider } from './provider';

export type MemberResolver = ReturnType<typeof createMemberResolver>;

export const createMemberResolver = (mailchimpConfig: ClientOptions, listId: string) => {
	const provider = createMemberProvider(mailchimpConfig, listId);

	@Resolver(() => Member)
	class MemberResolver extends createBaseResolver<Member, MemberDataEntity>(Member, provider) {}

	return MemberResolver;
};
