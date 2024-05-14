// In some cases when linking across from one data source to another, it's very handy
// to flatten entities from:
//
// job.account = { id : 'whatever' }
//
// to
//
// job.crmAccountId = 'whatever'
//
// This allows us to treat them consistently from an API standpoint
// but actually store the values where they need to go.

import { AnyEntity } from '@mikro-orm/core';

export type StringDictionary = { [key: string]: string };

// A map of classes to dictionary.
export const externalIdFieldMap = new Map<string, StringDictionary>();

export const ExternalIdField =
	({ from }: { from: string }) =>
	(target: AnyEntity, field: string) => {
		const existing = externalIdFieldMap.get(target.constructor.name) || {};
		existing[from] = field;
		externalIdFieldMap.set(target.constructor.name, existing);
	};
