import { v4 } from 'uuid';
import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { ReportWithRows, RowType } from 'xero-node';
import { ProfitAndLossRow } from './entity';
import { isUUID } from 'class-validator';

const parseReport = (report: ReportWithRows) => {
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

						const accountAttribute = value.attributes?.find((attribute) => {
							console.log(`'${attribute.value}': ${isUUID(attribute.value)}`);
							return attribute.id === 'account' && isUUID(attribute.value);
						});

						results.push(
							ProfitAndLossRow.fromBackendEntity({
								id: v4(),
								accountId: accountAttribute ? accountAttribute.value : null,
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

@Resolver((of) => ProfitAndLossRow)
export class ProfitAndLossRowResolver extends createBaseResolver(
	ProfitAndLossRow,
	new XeroBackendProvider('ProfitAndLossRow', {
		find: async ({ xero, filter }) => {
			const to = new Date();

			// Xero limits us to 365 days.
			const from = new Date(to.valueOf());
			from.setDate(to.getDate() - 365);

			const { body } = await xero.accountingApi.getReportProfitAndLoss(
				'22460aa9-d4f8-4f35-98c5-7e407698ef2b',
				from.toISOString(),
				to.toISOString(),
				11,
				'MONTH'
			);

			return parseReport(body);
		},
	})
) {}
