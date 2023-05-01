import { createBaseResolver, Sort } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { ReportWithRows, RowType, XeroClient } from 'xero-node';
import { ProfitAndLossRow } from './entity';
import { isUUID } from 'class-validator';
import {
	forEachTenant,
	generateId,
	inMemoryFilterFor,
	offsetAndLimit,
	orderedResult,
} from '../../utils';

const defaultSort: Record<string, Sort> = { ['date']: Sort.DESC };

const parseReport = (tenantId: string, report: ReportWithRows) => {
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
							ProfitAndLossRow.fromBackendEntity({
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

@Resolver((of) => ProfitAndLossRow)
export class ProfitAndLossRowResolver extends createBaseResolver<ProfitAndLossRow, unknown>(
	ProfitAndLossRow,
	new XeroBackendProvider('ProfitAndLossRow', {
		find: async ({ xero, filter, order, limit, offset }) => {
			const result = await forEachTenant<ProfitAndLossRow>(
				xero,
				(tenant) => loadReportForTenant(xero, tenant.tenantId),
				filter
			);

			const sortFields = order ?? defaultSort;

			// (filter) -> order -> limit/offset
			return offsetAndLimit(
				orderedResult(result.filter(inMemoryFilterFor(filter)), sortFields),
				offset,
				limit
			);
		},
	})
) {}
