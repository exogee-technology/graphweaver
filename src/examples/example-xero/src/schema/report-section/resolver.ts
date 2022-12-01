import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { ReportSection } from './entity';

@Resolver((of) => ReportSection)
export class ReportSectionResolver extends createBaseResolver(
	ReportSection,
	new XeroBackendProvider('ReportSection')
) {}
