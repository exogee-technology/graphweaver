import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';

import { interest, category, mailingList, member } from './schema';

const {
	MAILCHIMP_API_KEY,
	MAILCHIMP_SERVER_PREFIX,
	MAILCHIMP_LIST_ID,
	MAILCHIMP_PROJECTS_CATEGORY_ID,
} = process.env;
if (!MAILCHIMP_API_KEY) throw new Error('MAILCHIMP_API_KEY is required in environment');
if (!MAILCHIMP_SERVER_PREFIX) throw new Error('MAILCHIMP_SERVER_PREFIX is required in environment');
if (!MAILCHIMP_LIST_ID) throw new Error('MAILCHIMP_LIST_ID is required in environment');
if (!MAILCHIMP_PROJECTS_CATEGORY_ID)
	throw new Error('MAILCHIMP_PROJECTS_CATEGORY_ID is required in environment');

const resolvers = [interest, category, mailingList, member];

const graphweaver = new Graphweaver({
	resolvers,
});

exports.handler = graphweaver.handler();
