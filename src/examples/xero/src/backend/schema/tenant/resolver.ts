import { createBaseResolver, Sort, Resolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { inMemoryFilterFor, offsetAndLimit, orderedResult } from '../../utils';
import { Tenant, XeroTenant } from './entity';

const defaultSort: Record<string, Sort> = { ['tenantName']: Sort.ASC };

@Resolver((of) => Tenant)
export class TenantResolver extends createBaseResolver<Tenant, XeroTenant>(
	Tenant,
	new XeroBackendProvider('Tenant', {
		find: async ({ xero, filter, order, limit, offset }) => {
			if (!xero.tenants.length) await xero.updateTenants(false);

			// We want to clone the tenants so we don't mutate Xero's internal state
			// When setting our id to tenantId.
			const copy = JSON.parse(JSON.stringify(xero.tenants));
			copy.forEach((tenant) => (tenant.id = tenant.tenantId));

			const sortFields = order ?? defaultSort;

			// filter -> order -> limit/offset
			return offsetAndLimit(
				orderedResult(copy.filter(inMemoryFilterFor(filter)), sortFields),
				offset,
				limit
			);
		},
	})
) {}
