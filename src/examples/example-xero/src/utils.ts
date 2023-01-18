import { Sort } from '@exogee/graphweaver';
import { XeroClient } from 'xero-node';
import { XeroTenant } from './schema';

const PAGE_SIZE = 100;

export type WithTenantId<T> = T & { tenantId: string };

type ForEachTenantCallback<T> = (tenant: XeroTenant) => T | T[] | Promise<T> | Promise<T[]>;

export const forEachTenant = async <T = unknown>(
	xero: XeroClient,
	callback: ForEachTenantCallback<T>
): Promise<WithTenantId<T>[]> => {
	if (!xero.tenants.length) await xero.updateTenants(false);

	const results = await Promise.all(
		xero.tenants.map(async (tenant) => {
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

export const inMemoryFilterFor = (rawFilter: Record<string, any>) => (item) => {
	for (const [key, value] of Object.entries(rawFilter || {})) {
		if (key === '_or') {
			for (const condition of value) {
				if (inMemoryFilterFor(condition)(item)) return true;
			}
			return false;
		} else if (key === '_and') {
			for (const condition of value) {
				if (!inMemoryFilterFor(condition)(item)) return false;
			}
			return true;
		} else if (key.indexOf('_') >= 0) {
			throw new Error(`Filter ${key} not yet implemented.`);
		} else if (item[key] !== value) {
			// Simple equality comparison
			return false;
		}
	}

	return true;
};

export const offsetAndLimit = <T>(result: T[], offset?: number, limit?: number) => {
	const realLimit = limit ?? 100;
	const realOffset = offset ?? 0;
	return result.slice(realOffset, realOffset + realLimit);
};

// TODO: Use type definitions for this instead of calling instanceof etc

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

	// TODO: Function returns bigint boolean number string Date...? Any other GraphQL types which are sortable?

	// Composite fields, special fields etc - ret false
	return false;
};

// 1. Reverse the sort if DESC is passed in
// 2. Receive a get() function to extract the comparable items - pass a lambda for this
export const compareFn = <T, K>(get: (t: T) => K, ascOrDesc: Sort): ((a: T, b: T) => number) => {
	const sign = ascOrDesc === Sort.ASC ? 1 : -1;
	return (a: T, b: T) => {
		const valA: K = get(a);
		const valB: K = get(b);
		return valA < valB ? -1 * sign : valA > valB ? sign : 0;
	};
};

export const orderedResult = <T>(result: T[], sortFields: Record<string, Sort>) => {
	// Use the first record returned
	if (result.length > 0) {
		const firstRecord = result[0];
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
		chunks.push(`${key} ${value}`);
	}

	return chunks.join(', ') || undefined;
};

// Convert Record<string, Sort> into array { fieldName: string, sort: Sort}[]
// Do checks
// Map to array { field: any, sort: Sort }[] (get(item) -> item => item[fieldName])
// Want to end up with
// valA0 < valB0 ? -1 * sign0 : valA0 > valB0 ? sign0 : valA1 < valB1 ?  -1 * sign1 : valA1 > valB1 ? sign1 : ... : 0
// -> fn(a,b,sign) => a < b ? -1*sign : a > b ? sign : 0
// -> fn(valA0, valB0, sign0) || fn(valA1, valB1, sign1) || ... || 0
// -> x.reduce((arr, next) => {
//		return arr || fn(next.a, next.b, next.sign)
// }, 0)

//   /// Comparison function for sort on two separate properties, eg. a numeric one and a string.
//   /// the get function should return a pair of values.
//   export function compareFnTwoProperties<T, K1, K2>(get: (t: T) => Pair<K1, K2>): (a: T, b: T) => number {
// 	return (a: T, b: T) => {
// 	  const valA: Pair<K1, K2> = get(a);
// 	  const valB: Pair<K1, K2> = get(b);
// 	  return valA.v1 < valB.v1 ? -1 : valA.v1 > valB.v1 ? 1 : valA.v2 < valB.v2 ? -1 : valA.v2 > valB.v2 ? 1 : 0;
// 	};
//   }
