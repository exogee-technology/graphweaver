import { RelationshipField, Field, ID, Entity, Sort, fromBackendEntity } from '@exogee/graphweaver';
import { ISODateStringScalar } from '@exogee/graphweaver-scalars';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { ReportWithRows, RowType, XeroClient } from 'xero-node';
import { isUUID } from 'class-validator';

import { Account } from './account';
import { Tenant } from './tenant';

import {
	forEachTenant,
	generateId,
	inMemoryFilterFor,
	offsetAndLimit,
	orderedResult,
} from '../utils';

const defaultSort: Record<string, Sort> = { ['date']: Sort.DESC };

const parseReport = async (tenantId: string, report: ReportWithRows) => {
	if (!report.reports || report.reports.length === 0) throw new Error('No reports to parse');

	const results: ProfitAndLossRow[] = [];

	for (const data of report.reports) {
		// Find the date buckets from the header. These are used later when adding rows.
		const dates = data.rows?.[0].cells.slice(1).map(({ value }) => new Date(value));

		if (!Array.isArray(dates)) {
			console.warn('Could not read dates from report. Skipping.');
			continue;
		}

		// Ok, read the rows.
		for (const section of data.rows.slice(1)) {
			if (section.rowType === RowType.Section) {
				for (const row of section.rows) {
					const [description, ...otherCells] = row.cells;

					// We're using a normal for loop here to correlate each cell with the date
					// from the header above.
					for (let i = 0; i < otherCells.length; i++) {
						const date = dates[i];
						const value = otherCells[i];

						const accountAttribute = value.attributes?.find(
							(attribute) => attribute.id === 'account' && isUUID(attribute.value)
						);

						results.push(
							await fromBackendEntity(ProfitAndLossRow, {
								// @todo: This ID will not remain unchanged following a mutation -- though that may not be a problem.
								id: generateId(
									tenantId +
										(accountAttribute?.value ?? '') +
										(value.value || '') +
										date.toString() +
										(description.value || '')
								),
								tenantId,
								accountId: accountAttribute?.value ?? null,
								amount: parseFloat(value.value),
								date,
								description: description.value,
								isCollection: () => false,
								isReference: () => false,
							})
						);
					}
				}
			}
		}
	}

	return results;
};

const loadReportForTenant = async (xero: XeroClient, tenantId: string) => {
	const today = new Date();
	const from = new Date(today.getFullYear(), today.getMonth(), 1);
	const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);

	const { body } = await xero.accountingApi.getReportProfitAndLoss(
		tenantId,
		from.toISOString(),
		to.toISOString(),
		11,
		'MONTH'
	);

	return parseReport(tenantId, body);
};

const provider = new XeroBackendProvider('ProfitAndLossRow', {
	find: async ({ xero, filter, order, limit, offset }) => {
		const result = await forEachTenant<ProfitAndLossRow>(
			xero,
			(tenant) => loadReportForTenant(xero, tenant.tenantId),
			filter
		);

		const sortFields = order ?? defaultSort;

		// (filter) -> order -> limit/offset
		return offsetAndLimit<any>(
			orderedResult(result.filter(inMemoryFilterFor(filter)), sortFields),
			offset,
			limit
		);
	},
});

export interface XeroProfitAndLossRow {
	id: string;
	date: Date;
	description: string;
	accountId: string;
	tenantId: string;
	amount: number;
}

@Entity('ProfitAndLossRow', {
	provider,
})
export class ProfitAndLossRow {
	@Field(() => ID)
	id!: string;

	@Field(() => ISODateStringScalar)
	date!: Date;

	@Field(() => String)
	description!: string;

	@Field(() => Number)
	amount!: number;

	@Field(() => ID, { nullable: true, adminUIOptions: { hideInFilterBar: true } })
	accountId?: string;

	@RelationshipField<ProfitAndLossRow>(() => Account, { id: 'accountId', nullable: true })
	account!: Account;

	@Field(() => ID, { nullable: true, adminUIOptions: { hideInFilterBar: true } })
	tenantId?: string;

	@RelationshipField<ProfitAndLossRow>(() => Tenant, { id: 'tenantId' })
	tenant!: Tenant;
}
