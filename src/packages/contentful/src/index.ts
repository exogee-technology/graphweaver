import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { createClient, CreateClientParams, ContentfulClientApi } from 'contentful';
import { createResolver, createProvider } from '@exogee/graphweaver-helpers';

import { caps, addResolveToFields, mapContentfulItem } from './util';

// @todo allow to pass in the typescript shape of the entity instead of assuming Record<string, any>
export const createContentfulResolver = (
	clientParams: CreateClientParams,
	contentTypeId: string
) => {
	const schemaPath = join(cwd(), '.graphweaver', 'contentful', `${contentTypeId}.schema.json`);
	const fields = addResolveToFields(JSON.parse(readFileSync(schemaPath).toString()));

	return createResolver({
		name: `contentful${caps(contentTypeId)}`,
		fields,
		provider: createProvider<Record<string, any>, { client: ContentfulClientApi<undefined> }>({
			backendId: 'Contentful',
			init: async () => {
				return { client: createClient(clientParams) };
			},
			read: async ({ client }, filter, pagination) => {
				if (filter?.id) return mapContentfulItem(await client.getEntry(filter.id), fields);

				const entries = await client.getEntries({ content_type: contentTypeId });
				return entries.items.map((item) => mapContentfulItem(item, fields));
			},
		}),
	});
};
