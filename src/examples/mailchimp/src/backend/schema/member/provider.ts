import Mailchimp from '@mailchimp/mailchimp_marketing/src/ApiClient';
import {
	createProvider,
	ItemWithId,
	createPaginationOptions,
	inMemoryFilterFor,
} from '@exogee/graphweaver-helpers';
import { ClientOptions } from '../index';
import { MemberDataEntity, MemberStatus } from './data-entity';
import md5 from 'md5';

type Entity = ItemWithId;
type Context = { client: any };

const getListMember = async (client: any, listId: string, memberId: string) => {
	try {
		return await client.lists.getListMember(listId, memberId);
	} catch (e) {
		return null;
	}
};

export const createMemberProvider = (mailchimpConfig: ClientOptions, listId: string) =>
	createProvider<Entity, Context, MemberDataEntity>({
		backendId: 'Mailchimp',
		init: async () => {
			const client = new Mailchimp();
			client.setConfig(mailchimpConfig);
			return { client, listId };
		},
		read: async ({ client }, filter, pagination) => {
			if (filter?.id) {
				return getListMember(client, listId, filter.id as string);
			} else if (Array.isArray(filter?._or)) {
				// Using the mailchimp field resolver on a currentUser query will go down this path (dataloader)
				const result = await Promise.all(
					filter._or.map(({ id }) => getListMember(client, listId, id as string))
				);
				return result.filter((r) => r !== null || r !== undefined);
			} else {
				try {
					const result = await client.lists.getListMembersInfo(listId, {
						...createPaginationOptions(pagination),
					});

					if (filter && result) {
						const memoryFilter = inMemoryFilterFor(filter);
						return result.members.filter(memoryFilter);
					}

					return result.members ?? [];
				} catch (e) {
					return null;
				}
			}
		},
		create: async ({ client }, { email_address, status }) => {
			// We can use email address to try find an exact match
			const result = await client.searchMembers.search(email_address);

			// If we found an active subscriber, return true to make this operation idempotent
			if (
				result.exact_matches.members.length === 1 &&
				result.exact_matches.members[0].status === MemberStatus.subscribed
			)
				return true;

			// Note if the member is archived, this will change their status back to 'subscribed'
			return await client.lists.addListMember(listId, {
				status,
				email_address,
			});
		},
		update: async ({ client }, id, { email_address, status }) => {
			const subscriberHash = md5(email_address);
			const result = await client.lists.updateListMember(listId, subscriberHash, {
				status,
			});
			return result;
		},
	});
