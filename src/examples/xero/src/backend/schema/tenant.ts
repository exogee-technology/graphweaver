import { GraphQLEntity, Field, ID, Entity, BaseDataEntity, Sort } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';

import { inMemoryFilterFor, offsetAndLimit, orderedResult } from '../utils';

// Xero doesn't provide a type for these for whatever reason. Both
// xero.tenants and xero.updateTenants() are typed as any[].
export interface XeroTenant extends BaseDataEntity {
	id: string;
	authEventId: string;
	tenantId: string;
	tenantType: 'ORGANISATION'; // Probably others, but can't find docs.
	tenantName: string;
	createdDateUtc: string; // ISO Date string
	updatedDateUtc: string; // ISO Date string

	// There are also org details, but we don't need those yet.
}

const defaultSort: Record<string, Sort> = { ['tenantName']: Sort.ASC };

const provider = new XeroBackendProvider('Tenant', {
	find: async ({ xero, filter, order, limit, offset }) => {
		if (!xero.tenants.length) await xero.updateTenants(false);

		// We want to clone the tenants so we don't mutate Xero's internal state
		// When setting our id to tenantId.
		const copy = JSON.parse(JSON.stringify(xero.tenants));
		copy.forEach((tenant) => (tenant.id = tenant.tenantId));

		const sortFields = order ?? defaultSort;

		// filter -> order -> limit/offset
		return offsetAndLimit<XeroTenant>(
			orderedResult(copy.filter(inMemoryFilterFor(filter)), sortFields),
			offset,
			limit
		);
	},
});

@Entity('Tenant', {
	provider,
})
export class Tenant extends GraphQLEntity<XeroTenant> {
	public dataEntity!: XeroTenant;

	@Field(() => ID)
	id!: string;

	@Field(() => String, { adminUIOptions: { hideInFilterBar: true } })
	authEventId!: string;

	@Field(() => String, { adminUIOptions: { summaryField: true } })
	tenantName!: string;

	@Field(() => String)
	tenantType!: string;

	@Field(() => String, { adminUIOptions: { hideInFilterBar: true } })
	createdDateUtc!: string;

	@Field(() => String, { adminUIOptions: { hideInFilterBar: true } })
	updatedDateUtc!: string;
}
