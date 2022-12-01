import { GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';
import { ReportWithRow } from 'xero-node';
import { ReportSection } from '../report-section';

@ObjectType('Report')
export class Report extends GraphQLEntity<ReportWithRow> {
	public dataEntity!: ReportWithRow;

	@Field(() => ID)
	reportID!: string;

	@Field(() => String)
	reportName!: string;

	@Field(() => [ReportSection], { nullable: false })
	async sections() {
		return this.dataEntity.rows?.map((section) => ReportSection.fromBackendEntity(section));
	}
}
