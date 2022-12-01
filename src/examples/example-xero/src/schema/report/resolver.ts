import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { ReportWithRow } from 'xero-node';

import { Report } from './entity';

@Resolver((of) => Report)
export class ReportResolver extends createBaseResolver(
	Report,
	new XeroBackendProvider(ReportWithRow, {
		find: async (xero) => {
			const to = new Date();

			// Xero limits us to 365 days.
			const from = new Date();
			from.setDate(to.getDate() - 365);

			try {
				const { body } = await xero.accountingApi.getReportProfitAndLoss(
					'22460aa9-d4f8-4f35-98c5-7e407698ef2b',
					from.toISOString(),
					to.toISOString(),
					11,
					'MONTH'
				);
				console.log(body);
				return body.reports;
			} catch (error) {
				// Nicer error message if we can muster it.
				if (error.response.body) throw error.response.body;

				throw error;
			}
		},
	})
) {}
