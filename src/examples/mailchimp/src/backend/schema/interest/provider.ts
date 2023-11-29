import Mailchimp from '@mailchimp/mailchimp_marketing/src/ApiClient';
import {
	createProvider,
	ItemWithId,
	createPaginationOptions,
	inMemoryFilterFor,
} from '@exogee/graphweaver-helpers';
import { ClientOptions } from '../index';
import { InterestDataEntity } from './data-entity';
import { CreateInterestResolverOptions } from './resolver';

type Entity = ItemWithId;
type Context = { client: any };

export const createInterestProvider = (
	mailchimpConfig: ClientOptions,
	{ listId, categoryId }: CreateInterestResolverOptions
) =>
	createProvider<Entity, Context, InterestDataEntity>({
		backendId: 'Mailchimp',
		init: async () => {
			const client = new Mailchimp();
			client.setConfig(mailchimpConfig);
			return { client };
		},
		read: async ({ client }, filter, pagination) => {
			if (filter?.id) {
				return await client.lists.getInterestCategoryInterest(listId, categoryId, filter.id); // @todo filter returned fields
			} else if (Array.isArray(filter?._or)) {
				const result = await Promise.all(
					filter._or.map(({ id }) =>
						client.lists.getInterestCategoryInterest(listId, categoryId, id)
					)
				);
				return result.filter((r) => r !== null || r !== undefined);
			} else {
				const result = await client.lists.listInterestCategoryInterests(listId, categoryId, {
					...createPaginationOptions(pagination),
				});

				if (filter && result) {
					const memoryFilter = inMemoryFilterFor(filter);
					return result.interests.filter(memoryFilter);
				}

				return result.interests ?? [];
			}
		},
		create: ({ client }, { name }) => {
			return client.lists.createInterestCategoryInterest(listId, categoryId, {
				name,
			});
		},
		update: async ({ client }, id, { name }) => {
			const result = await client.lists.updateInterestCategoryInterest(listId, categoryId, id, {
				name,
			});
			return result;
		},
	});
