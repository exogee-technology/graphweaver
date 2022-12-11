import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { inMemoryFilterFor } from '../../utils';
import { Tenant } from './entity';

@Resolver((of) => Tenant)
export class TenantResolver extends createBaseResolver(
	Tenant,
	new XeroBackendProvider('Tenant', {
		find: async ({ xero, rawFilter }) => {
			if (!xero.tenants.length) await xero.updateTenants(false);

			// We want to clone the tenants so we don't mutate Xero's internal state
			// When setting our id to tenantId.
			const copy = JSON.parse(JSON.stringify(xero.tenants));
			copy.forEach((tenant) => (tenant.id = tenant.tenantId));

			return copy.filter(inMemoryFilterFor(rawFilter));
		},
	})
) {}
