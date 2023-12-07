import Mailchimp from '@mailchimp/mailchimp_marketing/src/ApiClient';
import {
	createProvider,
	ItemWithId,
	createPaginationOptions,
	inMemoryFilterFor,
} from '@exogee/graphweaver-helpers';
import { ClientOptions } from '../index';
import { CategoryDataEntity } from '../../entities/category';

type Entity = ItemWithId;
type Context = { client: any };

export const createCategoryProvider = (mailchimpConfig: ClientOptions, listId: string) =>
	createProvider<Entity, Context, CategoryDataEntity>({
		backendId: 'Mailchimp',
		init: async () => {
			const client = new Mailchimp();
			client.setConfig(mailchimpConfig);
			return { client };
		},
		read: async ({ client }, filter, pagination) => {
			if (filter?.id) return await client.lists.getInterestCategory(listId, filter.id); // @todo filter returned fields

			if (Array.isArray(filter?._or))
				return Promise.all(
					filter._or.map(({ id }) => client.lists.getInterestCategory(listId, id))
				);

			const result = await client.lists.getListInterestCategories(listId, {
				...createPaginationOptions(pagination),
			});

			if (filter && result) {
				const memoryFilter = inMemoryFilterFor(filter);
				return result.categories.filter(memoryFilter);
			}

			return result.categories ?? [];
		},
		create: ({ client }, { title }) => {
			return client.lists.createListInterestCategory(listId, {
				title,
				type: 'checkboxes',
			});
		},
		update: async ({ client }, id, { title }) => {
			const result = await client.lists.updateInterestCategory(listId, id, {
				title,
			});
			return result;
		},
	});
