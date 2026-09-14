import { DocumentNode } from 'graphql';

import { Entity, Schema } from '../utils/schema-types.js';
import * as detailPanel from './detail-panel.js';
import * as filters from './filters.js';
import { listEntityForExport } from './export.js';
import { queryForEntityEdit } from './entity-edit.js';
import { queryForEntityPage } from './entity-list.js';
import { SCHEMA_QUERY } from './select.js';
import { TENANTS_QUERY } from './side-bar.js';

export type EnumeratedDocument = {
	/** Where this document came from, so a build failure can point at something useful. */
	source: string;
	document: DocumentNode;
};

/**
 * Every operation the Admin UI is capable of sending for a given schema.
 *
 * The Admin UI builds most of its documents at runtime from `_graphweaver` metadata, so they
 * can't be found by scanning source files. This walks the same generators the Admin UI itself
 * uses to produce the complete set, which the build then hashes into the `admin-ui` allow list.
 *
 * If you add a generator to `documents/`, add it here too - `enumerate.test.ts` fails if you
 * don't. The one deliberate omission is `fragmentForDisplayValueOfEntity`, which is only ever
 * handed to `apolloClient.readFragment` for a local cache read and never reaches the server.
 */
export const enumerateAdminUiDocuments = (schema: Schema): EnumeratedDocument[] => {
	const entitiesByName = new Map(schema.entities.map((entity) => [entity.name, entity]));

	const entityByType = (type: string): Entity => {
		const entity = entitiesByName.get(type);
		if (!entity) throw new Error(`Related entity ${type} not found`);
		return entity;
	};

	const documents: EnumeratedDocument[] = [
		{ source: 'admin-ui: metadata', document: SCHEMA_QUERY },
		{ source: 'admin-ui: side bar tenants', document: TENANTS_QUERY },
		{ source: 'admin-ui: upload url', document: detailPanel.getUploadUrlMutation },
		{ source: 'admin-ui: delete url', document: detailPanel.getDeleteUrlMutation },
	];

	const add = (source: string, document: DocumentNode | undefined) => {
		if (document) documents.push({ source, document });
	};

	for (const entity of schema.entities) {
		const where = (what: string) => `admin-ui: ${entity.name} ${what}`;

		// A relationship field pointing at an entity that isn't in the metadata (it might be
		// hidden, or excluded from the built in operations) makes every document that selects
		// it ungeneratable. That's the Admin UI's problem at runtime too, so skip rather than
		// failing the whole build over it.
		const tryAdd = (what: string, generate: () => DocumentNode | undefined) => {
			try {
				add(where(what), generate());
			} catch {
				// Intentionally quiet: the Admin UI can't render this view either.
			}
		};

		tryAdd('list', () => queryForEntityPage(entity.name, entityByType));
		tryAdd('detail', () => queryForEntityEdit(entity, entityByType));
		tryAdd('csv export', () => listEntityForExport(entity, entityByType));
		tryAdd('create', () => detailPanel.generateCreateEntityMutation(entity, entityByType));
		tryAdd('update', () => detailPanel.generateUpdateEntityMutation(entity, entityByType));
		tryAdd('delete', () => detailPanel.generateDeleteEntityMutation(entity));
		tryAdd('delete many', () => detailPanel.generateDeleteManyEntitiesMutation(entity));
		tryAdd('relationship', () => detailPanel.getRelationshipQuery(entity));
		tryAdd('relationship count', () => detailPanel.getRelationshipCountQuery(entity));
		tryAdd('filter relationship', () => filters.getRelationshipQuery(entity));

		for (const field of entity.fields) {
			if (field.hideInFilterBar) continue;
			tryAdd(`filter options for ${field.name}`, () =>
				filters.getFilterOptionsQuery(entity, field.name)
			);
		}
	}

	return documents;
};
