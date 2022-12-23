import { XeroClient } from 'xero-node';
import { XeroTenant } from './schema';

type WithTenantId<T> = T & { tenantId: string };

type ForEachTenantCallback<T> = (tenant: XeroTenant) => T | T[] | Promise<T> | Promise<T[]>;

export const forEachTenant = async <T = unknown>(
	xero: XeroClient,
	callback: ForEachTenantCallback<T>,
	rawFilter?: Record<string, any>
): Promise<WithTenantId<T>[]> => {
	if (!xero.tenants.length) await xero.updateTenants(false);

	// Parse the filter, and if it contains a "tenantId" clause, filter the available Tenants accordingly.
	// For this version, just look for a simple 'tenantId'='...' and nothing else
	const filteredTenants =
		rawFilter && Object.keys(rawFilter).includes('tenantId')
			? [...xero.tenants.filter((tenant) => tenant.tenantId === rawFilter['tenantId'])]
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

export const inMemoryFilterFor = (rawFilter: Record<string, any>) => (
	item: Record<string, any>
) => {
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

/// Generate a deterministic ID for a string
/// This is not sophisticated and is a shortened but still performant version of
/// Java's hashCode function, modified to always return a positive number
/// (see https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript)
export const generateId = (source: string): string => {
	let hash = 0;
	let i = 0;
	if (source.length === 0) return '0';
	while (i < source.length) {
		hash = (((hash << 5) - hash + source.charCodeAt(i++)) << 0) >>> 0;
	}
	return '' + hash;
};
