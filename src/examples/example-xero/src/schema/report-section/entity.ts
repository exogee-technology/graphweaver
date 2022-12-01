import { GraphQLEntity } from '@exogee/graphweaver';
import { Field, ObjectType, registerEnumType } from 'type-graphql';
import { ReportRows as XeroReportRows, RowType } from 'xero-node';
import { ReportRow } from '../report-row';

registerEnumType(RowType, { name: 'RowType' });

@ObjectType('ReportSection')
export class ReportSection extends GraphQLEntity<XeroReportRows> {
	public dataEntity!: XeroReportRows;

	@Field(() => RowType)
	rowType!: RowType;

	@Field(() => String, { nullable: true })
	title?: string;

	@Field(() => [ReportRow], { nullable: true })
	async rows() {
		return this.dataEntity.rows?.map((row) => ReportRow.fromBackendEntity(row));
	}
}
