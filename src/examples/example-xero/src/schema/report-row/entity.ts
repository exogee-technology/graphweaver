import { GraphQLEntity } from '@exogee/graphweaver';
import { Field, ObjectType, registerEnumType } from 'type-graphql';
import { ReportRow as XeroReportRow, RowType } from 'xero-node';
import { ReportCell } from '../report-cell';

registerEnumType(RowType, { name: 'RowType' });

@ObjectType('ReportRow')
export class ReportRow extends GraphQLEntity<XeroReportRow> {
	public dataEntity!: XeroReportRow;

	@Field(() => RowType)
	rowType!: RowType;

	@Field(() => String)
	title!: string;

	@Field(() => ReportCell, { nullable: false })
	async cells() {
		return this.dataEntity.cells?.map((cell) => ReportCell.fromBackendEntity(cell));
	}
}
