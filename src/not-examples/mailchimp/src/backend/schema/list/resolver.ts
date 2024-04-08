import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MailingList } from './entity';
import { ClientOptions } from '../index';
import { MailingListDataEntity } from '../../entities/list';
import { createMailingListProvider } from './provider';

export type MailingListResolver = ReturnType<typeof createMailingListResolver>;

export const createMailingListResolver = (mailchimpConfig: ClientOptions) => {
	const provider = createMailingListProvider(mailchimpConfig);

	@Resolver(() => MailingList)
	class MailingListResolver extends createBaseResolver<MailingList, MailingListDataEntity>(
		MailingList,
		provider
	) {}

	return MailingListResolver;
};
