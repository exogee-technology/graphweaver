import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { ReportCell } from './entity';
import { ReportCell as XeroReportCell } from 'xero-node';

@Resolver((of) => ReportCell)
export class ReportCellResolver extends createBaseResolver(
	ReportCell,
	new XeroBackendProvider(XeroReportCell)
) {}
