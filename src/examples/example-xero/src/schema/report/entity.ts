import { GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';
import { ReportWithRow } from 'xero-node';
import { ReportRow } from '../report-row';

@ObjectType('Report')
export class Report extends GraphQLEntity<ReportWithRow> {
	public dataEntity!: ReportWithRow;

	@Field(() => ID)
	reportID!: string;

	@Field(() => String)
	reportName!: string;

	@Field(() => ReportRow, { nullable: false })
	async rows() {
		return this.dataEntity.rows?.map(({ rows }) =>
			rows.map((row) => ReportRow.fromBackendEntity(row))
		);
	}
}
