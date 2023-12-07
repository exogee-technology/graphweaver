import { MailingListResolver, createMailingListResolver } from './list';
import { CategoryResolver, createCategoryResolver } from './category';
import { InterestResolver, createInterestResolver } from './interest';
import { MemberResolver, createMemberResolver } from './member';

export type ClientOptions = {
	apiKey: string;
	server: string;
};

export const mailingList: MailingListResolver =
	process.env.MAILCHIMP_API_KEY &&
	process.env.MAILCHIMP_SERVER_PREFIX &&
	createMailingListResolver({
		apiKey: process.env.MAILCHIMP_API_KEY,
		server: process.env.MAILCHIMP_SERVER_PREFIX,
	});

export const category: CategoryResolver =
	process.env.MAILCHIMP_API_KEY &&
	process.env.MAILCHIMP_SERVER_PREFIX &&
	process.env.MAILCHIMP_LIST_ID &&
	createCategoryResolver(
		{
			apiKey: process.env.MAILCHIMP_API_KEY,
			server: process.env.MAILCHIMP_SERVER_PREFIX,
		},
		process.env.MAILCHIMP_LIST_ID
	);

export const interest: InterestResolver =
	process.env.MAILCHIMP_API_KEY &&
	process.env.MAILCHIMP_SERVER_PREFIX &&
	process.env.MAILCHIMP_LIST_ID &&
	createInterestResolver(
		{
			apiKey: process.env.MAILCHIMP_API_KEY,
			server: process.env.MAILCHIMP_SERVER_PREFIX,
		},
		{
			listId: process.env.MAILCHIMP_LIST_ID,
			categoryId: process.env.MAILCHIMP_PROJECTS_CATEGORY_ID,
		}
	);

export const member: MemberResolver =
	process.env.MAILCHIMP_API_KEY &&
	process.env.MAILCHIMP_SERVER_PREFIX &&
	process.env.MAILCHIMP_LIST_ID &&
	createMemberResolver(
		{
			apiKey: process.env.MAILCHIMP_API_KEY,
			server: process.env.MAILCHIMP_SERVER_PREFIX,
		},
		process.env.MAILCHIMP_LIST_ID
	);
