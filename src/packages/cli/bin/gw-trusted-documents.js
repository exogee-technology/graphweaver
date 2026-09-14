#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const builder = require('@exogee/graphweaver-builder');
const { config } = require('@exogee/graphweaver-config');
const path = require('path');

const generateTrustedDocuments = async () => {
	// Check this before importing anything: getting the schema means importing the built backend,
	// which boots the app, and an app that needs environment variables we haven't got will throw.
	// Projects that haven't opted into trusted documents shouldn't pay that cost at all.
	const { trustedDocuments } = config();
	if (!Object.keys(trustedDocuments?.allowLists ?? {}).length) return;

	const buildDir = path.posix.join('file://', process.cwd(), `./.graphweaver/backend/index.js`);
	const { graphweaver } = await import(buildDir);

	if (!graphweaver?.schema) {
		console.warn(
			'No schema found. To generate trusted documents make sure that you export Graphweaver from your index file.'
		);
		process.exit(0);
	}

	// The Admin UI builds its documents from this metadata, so we need exactly what it would
	// receive in order to work out what it can send.
	const metadata = await builder.readAdminUiMetadata();

	const generated = await builder.generateTrustedDocuments({
		schema: graphweaver.schema,
		metadata,
	});

	if (!generated) {
		console.log('No trusted document allow lists are configured, nothing to do.');
		process.exit(0);
	}

	const generatedFile = builder.writeGeneratedManifest(generated);
	const manifests = builder.writeClientManifests(generated);

	for (const [name, documents] of Object.entries(generated.allowLists)) {
		console.log(` - ${name}: ${documents.length} document(s)`);
	}

	console.log(`Baked ${generated.total} trusted document(s) into ${generatedFile}.`);
	console.log(`Client manifests written to:\n  ${manifests.join('\n  ')}`);
};

generateTrustedDocuments()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error.message ?? error);
		process.exit(1);
	});
