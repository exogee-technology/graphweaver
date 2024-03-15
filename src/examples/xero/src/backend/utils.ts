import { XeroClient } from 'xero-node';
import { Sort } from '@exogee/graphweaver';
import { XeroTenant } from './schema';

const PAGE_SIZE = 100;

export type WithTenantId<T> = T & { tenantId: string };

type ForEachTenantCallback<T> = (tenant: XeroTenant) => T | T[] | Promise<T> | Promise<T[]>;

type ObjectWithId = {
	id: string;
};

const hasId = (obj: unknown): obj is ObjectWithId => {
	return typeof (obj as ObjectWithId).id === 'string';
};

const isObject = (value: unknown) => {
	return value != null && typeof value === 'object';
};

export const forEachTenant = async <T = unknown>(
	xero: XeroClient,
	callback: ForEachTenantCallback<T>,
	filter?: Record<string, any>
): Promise<WithTenantId<T>[]> => {
	if (!xero.tenants.length) await xero.updateTenants(false);

	const [tenantFilter] = splitFilter(filter);

	const filteredTenants = tenantFilter
		? xero.tenants.filter(inMemoryFilterFor(tenantFilter))
		: xero.tenants;

	const results = await Promise.all(
		filteredTenants.map(async (tenant) => {
			const result = (await callback(tenant)) as WithTenantId<T>;

			// We should go ahead and doctor up the result(s) with a tenantId,
			// as Xero never adds it, but we need it on everything we're doing
			// a forEachTenant on.
			if (Array.isArray(result)) {
				result.forEach((element) => (element.tenantId = tenant.tenantId));
			} else {
				result.tenantId = tenant.tenantId;
			}

			return result;
		})
	);

	// Now we have a two dimensional array, which is an array for each tenant. Let's flatten it.
	return results.flat() as WithTenantId<T>[];
};

export const inMemoryFilterFor = (filter: Record<string, any>) => (item: Record<string, any>) => {
	for (const [filterKey, filterValue] of Object.entries(filter || {})) {
		if (filterKey === '_or') {
			for (const condition of filterValue) {
				if (inMemoryFilterFor(condition)(item)) return true;
			}
			return false;
		} else if (filterKey === '_and') {
			for (const condition of filterValue) {
				if (!inMemoryFilterFor(condition)(item)) return false;
			}
			return true;
		} else if (filterKey.indexOf('_') >= 0) {
			const keyParts = filterKey.split('_', 2);
			const [key, operator] = keyParts;
			const value = item[key];
			switch (operator) {
				case 'gt':
					return isNumeric(value) && isNumeric(filterValue)
						? +value > +filterValue
						: isDate(value) && isDate(filterValue)
							? new Date(value).valueOf() > new Date(filterValue).valueOf()
							: (value as string).localeCompare(filterValue as string) > 0;
				case 'gte':
					return isNumeric(value) && isNumeric(filterValue)
						? +value >= +filterValue
						: isDate(value) && isDate(filterValue)
							? new Date(value).valueOf() >= new Date(filterValue).valueOf()
							: (value as string).localeCompare(filterValue as string) >= 0;
				case 'lt':
					return isNumeric(value) && isNumeric(filterValue)
						? +value < +filterValue
						: isDate(value) && isDate(filterValue)
							? new Date(value).valueOf() < new Date(filterValue).valueOf()
							: (value as string).localeCompare(filterValue as string) < 0;
				case 'lte':
					return isNumeric(value) && isNumeric(filterValue)
						? +value <= +filterValue
						: isDate(value) && isDate(filterValue)
							? new Date(value).valueOf() <= new Date(filterValue).valueOf()
							: (value as string).localeCompare(filterValue as string) <= 0;
				default:
					throw new Error(`Filter ${filterKey} not yet implemented.`);
			}
		} else if (isObject(filterValue) && hasId(filterValue)) {
			// If we have an filter with an object and an ID then flatten the object and map it
			// For example: { account: { id: '123' } } to { accountId: '123' }
			return filterValue?.id === item?.[`${filterKey}Id`];
		} else {
			if (
				item[filterKey] === null ||
				item[filterKey] === undefined ||
				item[filterKey] !== filterValue
			) {
				return false;
			}
		}
	}
	return true;
};

// Generate a deterministic ID for a string
// This is not sophisticated and is a shortened but still performant version of
// Java's hashCode function, modified to always return a positive number
// (see https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript)
export const generateId = (source: string): string => {
	let hash = 0;
	let i = 0;
	if (source.length === 0) return '0';
	while (i < source.length) {
		hash = (((hash << 5) - hash + source.charCodeAt(i++)) << 0) >>> 0;
	}
	return '' + hash;
};

export const offsetAndLimit = <T>(result: T[], offset?: number, limit?: number) => {
	const realLimit = limit ?? 100;
	const realOffset = offset ?? 0;
	return result.slice(realOffset, realOffset + realLimit);
};

// @todo: Use schema defs to control what shows up in the schema as a sortable field
export const isSortable = <T>(field: T | undefined) => {
	if (field === undefined) {
		return false;
	}

	if (['bigint', 'boolean', 'number', 'string'].some((t) => typeof field === t)) {
		return true;
	}

	// special case: Date
	if (field instanceof Date) {
		return true;
	}

	// Composite fields, special fields etc - ret false
	return false;
};

// 1. Reverse the sort if DESC is passed in
// 2. Receive a get() function to extract the comparable items - pass a lambda for this
export const compareFn = <T, K>(get: (t: T) => K, ascOrDesc: Sort): ((a: T, b: T) => number) => {
	const sign = ascOrDesc === Sort.ASC ? 1 : -1;
	return (a: T, b: T) => {
		const valA = get(a);
		const valB = get(b);
		return valA < valB ? -1 * sign : valA > valB ? sign : 0;
	};
};

export const orderedResult = <T>(result: T[], sortFields: Record<string, Sort>) => {
	// Use the first record returned
	if (result.length > 0) {
		const [firstRecord] = result;
		// TODO: Implement multi-level sort (f1 ASC, f2 DESC, f3 DESC ...)
		for (const [fieldName, sort] of Object.entries(sortFields)) {
			if (isSortable(firstRecord[fieldName])) {
				return result.sort(compareFn((row) => row[fieldName], sort));
			}
		}
	}
	return result;
};

export const orderByToString = (orderBy: Record<string, Sort>): string | undefined => {
	const chunks: string[] = [];
	for (const [key, value] of Object.entries(orderBy)) {
		chunks.push(`${key} ${value.toUpperCase()}`);
	}

	return chunks.join(', ') || undefined;
};

const isNumeric = (item: unknown): boolean => {
	if (item === undefined || item === null) return false;
	if (typeof item === 'bigint' || typeof item === 'number') return true;
	if (typeof item === 'string') {
		return !isNaN(+item);
	}
	return false;
};

const isDate = (item: unknown): boolean => {
	if (item instanceof Date) return true;
	if (typeof item === 'string' || typeof item === 'number') {
		const date = new Date(item);
		return !isNaN(date.valueOf());
	}
	return false;
};

export const splitFilter = (filter: Record<string, any>): Record<string, any>[] => {
	// Check if tenants are filtered on - this filter is looking for an ID and will always fail
	// if one is passed in - resulting in no output here
	// So pull out the 'tenantId' field
	// @todo: fix inMemoryFilterFor
	const tenantFilter: Record<string, any> = {};
	const remainingFilter: Record<string, any> = Object.entries(filter || {}).reduce(
		(acc: Record<string, any>, [key, value]) => {
			if (key === 'tenantId') {
				tenantFilter[key] = value;
			} else acc[key] = value;
			return acc;
		},
		{}
	);
	return [tenantFilter, remainingFilter];
};
