import {
	Collection,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryKey,
	Property,
	Ref,
} from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Customer } from './customer';
import { InvoiceLine } from './invoice-line';

@Entity({ tableName: 'Invoice' })
export class Invoice extends BaseEntity {
	@PrimaryKey({ fieldName: 'InvoiceId', type: 'number' })
	id!: number;

	@ManyToOne({
		entity: () => Customer,
		ref: true,
		fieldName: 'CustomerId',
		index: 'IFK_InvoiceCustomerId',
	})
	customer!: Ref<Customer>;

	@Property({ fieldName: 'InvoiceDate', type: 'Date' })
	invoiceDate!: Date;

	@Property({ fieldName: 'BillingAddress', type: 'NVARCHAR(70)', nullable: true })
	billingAddress?: string;

	@Property({ fieldName: 'BillingCity', type: 'NVARCHAR(40)', nullable: true })
	billingCity?: string;

	@Property({ fieldName: 'BillingState', type: 'NVARCHAR(40)', nullable: true })
	billingState?: string;

	@Property({ fieldName: 'BillingCountry', type: 'NVARCHAR(40)', nullable: true })
	billingCountry?: string;

	@Property({ fieldName: 'BillingPostalCode', type: 'NVARCHAR(10)', nullable: true })
	billingPostalCode?: string;

	@Property({ fieldName: 'Total', type: 'NUMERIC(10,2)' })
	// Mikro-orm serializes this as a string for precision, but it's a number in the database
	total!: string;

	@OneToMany({ entity: () => InvoiceLine, mappedBy: 'invoice' })
	invoiceLines = new Collection<InvoiceLine>(this);
}
