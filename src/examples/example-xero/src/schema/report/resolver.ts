import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { Report } from './entity';

@Resolver((of) => Report)
export class ReportResolver extends createBaseResolver(
	Report,
	new XeroBackendProvider('ProfitAndLossReport', {
		find: async (xero) => {
			const to = new Date();

			// Xero limits us to 365 days.
			const from = new Date();
			from.setDate(to.getDate() - 365);

			const { body } = await xero.accountingApi.getReportProfitAndLoss(
				'22460aa9-d4f8-4f35-98c5-7e407698ef2b',
				from.toISOString(),
				to.toISOString(),
				11,
				'MONTH'
			);

			console.log(JSON.stringify(body.reports, null, 4));

			return body.reports;
		},
	})
) {}
