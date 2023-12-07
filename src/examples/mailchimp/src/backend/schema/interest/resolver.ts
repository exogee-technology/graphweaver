import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { Interest } from './entity';
import { ClientOptions } from '../index';
import { InterestDataEntity } from '../../entities/interest';
import { createInterestProvider } from './provider';

export interface CreateInterestResolverOptions {
	listId: string;
	categoryId: string;
}

export type InterestResolver = ReturnType<typeof createInterestResolver>;

export const createInterestResolver = (
	mailchimpConfig: ClientOptions,
	{ listId, categoryId }: CreateInterestResolverOptions
) => {
	const provider = createInterestProvider(mailchimpConfig, { listId, categoryId });

	@Resolver(() => Interest)
	class MailchimpInterestResolver extends createBaseResolver<Interest, InterestDataEntity>(
		Interest,
		provider
	) {}

	return MailchimpInterestResolver;
};
