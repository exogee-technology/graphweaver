import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { ReportRow } from './entity';
import { ReportRow as XeroReportRow } from 'xero-node';

@Resolver((of) => ReportRow)
export class ReportRowResolver extends createBaseResolver(
	ReportRow,
	new XeroBackendProvider(XeroReportRow)
) {}
