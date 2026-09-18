import { Entity, ID } from '@exogee/graphweaver';
import { ISODateStringScalar } from '@exogee/graphweaver-scalars';
import { Customer } from './customer';
import { InvoiceLine } from './invoice-line';
import { connection } from '../database';
import { Field, ManyToOne, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity('Invoice', {
	provider: new SqlDataProvider(() => Invoice, connection, { table: 'Invoice' }),
})
export class Invoice {
	@Field(() => ID, { column: 'InvoiceId', primaryKeyField: true })
	invoiceId!: number;

	@ManyToOne(() => Customer, { column: 'CustomerId' })
	customer!: Customer;

	@Field(() => ISODateStringScalar, { column: 'InvoiceDate' })
	invoiceDate!: Date;

	@Field(() => String, { column: 'BillingAddress', nullable: true })
	billingAddress?: string;

	@Field(() => String, { column: 'BillingCity', nullable: true })
	billingCity?: string;

	@Field(() => String, { column: 'BillingState', nullable: true })
	billingState?: string;

	@Field(() => String, { column: 'BillingCountry', nullable: true })
	billingCountry?: string;

	@Field(() => String, { column: 'BillingPostalCode', nullable: true })
	billingPostalCode?: string;

	@Field(() => String, { column: 'Total' })
	total!: string;

	@OneToMany(() => [InvoiceLine], { relatedField: 'invoice' })
	invoiceLines!: InvoiceLine[];
}
