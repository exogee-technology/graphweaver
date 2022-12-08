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

			console.log('Before filter: ', xero.tenants);
			const result = xero.tenants.filter(inMemoryFilterFor(rawFilter));
			console.log('After filter: ', result);

			for (const tenant of result) {
				tenant.id = tenant.tenantId;
			}

			return result;
		},
	})
) {}
