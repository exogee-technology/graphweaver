import { GraphQLEntity } from '@exogee/graphweaver';
import { Field, ObjectType } from 'type-graphql';
import { ReportCell as XeroReportCell } from 'xero-node';

@ObjectType('ReportCell')
export class ReportCell extends GraphQLEntity<XeroReportCell> {
	public dataEntity!: XeroReportCell;

	@Field(() => String, { nullable: true })
	value?: string;
}
