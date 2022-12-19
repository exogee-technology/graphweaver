import { XeroClient } from 'xero-node';
import { XeroTenant } from './schema';

type WithTenantId<T> = T & { tenantId: string };

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
