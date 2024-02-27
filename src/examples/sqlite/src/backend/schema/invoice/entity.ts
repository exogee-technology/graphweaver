import { Field, GraphQLEntity, ID, ObjectType, RelationshipField } from '@exogee/graphweaver';
import { ISODateStringScalar } from '@exogee/graphweaver-scalars';
import { Customer } from '../customer';
import { InvoiceLine } from '../invoice-line';
import { Invoice as OrmInvoice } from '../../entities';

@ObjectType('Invoice')
export class Invoice extends GraphQLEntity<OrmInvoice> {
	public dataEntity!: OrmInvoice;

	@Field(() => ID)
	id!: number;

	@RelationshipField<Invoice>(() => Customer, { id: (entity) => entity.customer?.id })
	customer!: Customer;

	@Field(() => ISODateStringScalar)
	invoiceDate!: Date;

	@Field(() => String, { nullable: true })
	billingAddress?: string;

	@Field(() => String, { nullable: true })
	billingCity?: string;

	@Field(() => String, { nullable: true })
	billingState?: string;

	@Field(() => String, { nullable: true })
	billingCountry?: string;

	@Field(() => String, { nullable: true })
	billingPostalCode?: string;

	@Field(() => String)
	total!: string;

	@RelationshipField<InvoiceLine>(() => [InvoiceLine], { relatedField: 'invoice' })
	invoiceLines!: InvoiceLine[];
}
