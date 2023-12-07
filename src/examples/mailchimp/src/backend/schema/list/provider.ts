import Mailchimp from '@mailchimp/mailchimp_marketing/src/ApiClient';
import {
	createProvider,
	ItemWithId,
	createPaginationOptions,
	inMemoryFilterFor,
} from '@exogee/graphweaver-helpers';
import { ClientOptions } from '../index';
import { MailingListDataEntity } from '../../entities/list';

type Entity = ItemWithId;
type Context = { client: any };

export const createMailingListProvider = (mailchimpConfig: ClientOptions) =>
	createProvider<Entity, Context, MailingListDataEntity>({
		backendId: 'Mailchimp',
		dataEntity: () => MailingListDataEntity,
		init: async () => {
			const client = new Mailchimp();
			client.setConfig(mailchimpConfig);
			return { client };
		},
		read: async ({ client }, filter, pagination) => {
			if (filter?.id) return await client.lists.getList(filter.id); // @todo filter returned fields

			if (Array.isArray(filter?._or))
				return Promise.all(filter._or.map(({ id }) => client.lists.getList(filter.id)));

			const result = await client.lists.getAllLists({
				...createPaginationOptions(pagination),
			});

			if (filter && result) {
				const memoryFilter = inMemoryFilterFor(filter);
				return result.lists.filter(memoryFilter);
			}

			return result.lists ?? [];
		},
	});
