import {
	RelationshipField,
	Field,
	ID,
	Entity,
	Filter,
	Sort,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Account as XeroAccount, AccountType } from 'xero-node';

import { Tenant } from './tenant';
import { forEachTenant, offsetAndLimit, orderByToString, splitFilter } from '../utils';

import { isUUID } from 'class-validator';

const defaultSort: Record<string, Sort> = { ['name']: Sort.ASC };

const provider = new XeroBackendProvider('Account', {
	find: async ({ xero, filter, order, limit, offset }) => {
		const fullSet = await forEachTenant<XeroAccount>(
			xero,
			async (tenant) => {
				const sortFields = order ?? defaultSort;
				const [_, remainingFilter] = splitFilter(filter);
				const {
					body: { accounts },
				} = await xero.accountingApi.getAccounts(
					tenant.tenantId,
					undefined,
					xeroFilterFrom(remainingFilter),
					orderByToString(sortFields)
				);

				for (const account of accounts) {
					(account as XeroAccount & { id: string }).id = account.accountID;
				}

				return accounts;
			},
			filter
		);

		// (filter) -> order -> limit/offset
		return offsetAndLimit<any>(fullSet, offset, limit);
	},
});

// Moved from base-resolver provider as only used here
// This takes:
// {
// 	_or: [
// 		{ id: '123'},
// 		{ id: '234'},
// 	]
// }
// and turns it into a string like:
// AccountID=="123" OR AccountID=="234"
// NB: This is currently used only for Accounts
const xeroFilterFrom = (filter: Filter<Account> | Filter<Account>[]) => {
	if (!filter) return undefined;

	const chunks: string[] = [];

	for (const [key, value] of Object.entries(filter)) {
		if (key === '_or' || key === '_and') {
			const subPredicates: string[] = [];
			for (const subPredicate of value as any[]) {
				const subFilter = xeroFilterFrom(subPredicate);
				if (subFilter) subPredicates.push(subFilter);
			}

			if (key === '_or') chunks.push(`${subPredicates.join(' OR ')}`);
			else chunks.push(`${subPredicates.join(' AND ')}`);
		} else {
			// Key structure: fieldName + optional predicate, assume no underscore in fieldName
			const keyParts = key.split('_', 2);
			const replacedKey = keyParts[0] === 'id' ? 'AccountID' : keyParts[0];
			let subFilter =
				typeof value === 'object' ? xeroFilterFrom(value) : (value as string | undefined);

			// Some Xero types need to be quoted.
			if (isUUID(subFilter, 4)) {
				subFilter = `GUID("${subFilter}")`;
			} else if (typeof subFilter === 'string') {
				// Assume this works for ISO date strings
				subFilter = `"${subFilter}"`;
			}

			if (key.endsWith('_gt')) {
				chunks.push(`${replacedKey}>${subFilter}`);
			} else if (key.endsWith('_gte')) {
				chunks.push(`${replacedKey}<=${subFilter}`);
			} else if (key.endsWith('_lt')) {
				chunks.push(`${replacedKey}<${subFilter}`);
			} else if (key.endsWith('_lte')) {
				chunks.push(`${replacedKey}<=${subFilter}`);
			} else {
				chunks.push(`${replacedKey}==${subFilter}`);
			}
		}
	}

	return chunks.join(' AND ') || undefined;
};

graphweaverMetadata.collectEnumInformation({
	target: AccountType,
	name: 'AccountType',
});

@Entity('Account', {
	provider,
})
export class Account {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { nullable: true })
	code?: string;

	@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@Field(() => AccountType, { nullable: true })
	type?: AccountType;

	@Field(() => String, { adminUIOptions: { hideInFilterBar: true } })
	tenantId!: string;

	@RelationshipField<Account>(() => Tenant, { id: 'tenantId' })
	tenant!: Tenant;
}
