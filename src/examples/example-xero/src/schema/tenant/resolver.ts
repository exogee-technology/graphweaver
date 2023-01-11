import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { inMemoryFilterFor } from '../../utils';
import { Tenant } from './entity';

@Resolver((of) => Tenant)
export class TenantResolver extends createBaseResolver(
	Tenant,
	new XeroBackendProvider('Tenant', {
		find: async ({ xero, rawFilter, order, limit, offset }) => {
			if (!xero.tenants.length) await xero.updateTenants(false);

			// We want to clone the tenants so we don't mutate Xero's internal state
			// When setting our id to tenantId.
			const copy = JSON.parse(JSON.stringify(xero.tenants));
			copy.forEach((tenant) => (tenant.id = tenant.tenantId));

			// TODO: Order...

			const filteredResult = copy.filter(inMemoryFilterFor(rawFilter));

			// TODO: cache for scrollback (and forward scroll)
			if (Array.isArray(filteredResult)) {
				const realLimit = limit ?? 100;
				const realOffset = offset ?? 0;
				return filteredResult.slice(realOffset, realOffset + realLimit);
			}

			return filteredResult;
		},
	})
) {}
