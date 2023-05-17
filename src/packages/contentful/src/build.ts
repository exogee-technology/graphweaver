import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { createClient, CreateClientParams } from 'contentful';

import { fieldFromContentfulTypeField } from './util';

export const buildContentfulSchema = async (
	clientParams: CreateClientParams,
	contentTypeId: string
) => {
	const schemaDir = join(cwd(), '.graphweaver', 'contentful');
	const schemaFile = join(schemaDir, `${contentTypeId}.schema.json`);

	// Get 'profile' content type
	const client = createClient(clientParams);
	const contentType = await client.getContentType(contentTypeId);

	// Map fields to createResolver fields
	const fields = contentType.fields.flatMap((field) => fieldFromContentfulTypeField(field) || []);

	// Write out schema file
	mkdirSync(schemaDir, { recursive: true });
	writeFileSync(schemaFile, JSON.stringify(fields));
};
