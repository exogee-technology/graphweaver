import { config } from '@exogee/graphweaver-config';

/**
 * Tells the Admin UI whether the API it's talking to enforces trusted documents.
 *
 * When it does, the Admin UI has to send document ids rather than operations. It builds most of
 * its documents at runtime from your schema, so it hashes them in the browser instead of
 * shipping a manifest - the build bakes the very same documents into the `admin-ui` allow list,
 * so the ids line up.
 */
export const loadTrustedDocuments = async (projectRoot: string) => {
	try {
		const { trustedDocuments } = config(projectRoot);
		const enabled = Object.keys(trustedDocuments?.allowLists ?? {}).length > 0;

		return `export const trustedDocumentsEnabled = ${enabled};`;
	} catch {
		return `export const trustedDocumentsEnabled = false;`;
	}
};
