import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Customer } from './customer';
import { InvoiceLine } from './invoice-line';

@Entity({ tableName: 'Invoice' })
export class Invoice {
	@PrimaryKey({ fieldName: 'InvoiceId', type: 'integer' })
	invoiceId!: number;

	@ManyToOne({ entity: () => Customer, ref: true, fieldName: 'CustomerId', index: 'IFK_InvoiceCustomerId' })
	customer!: Ref<Customer>;

	@Property({ fieldName: 'InvoiceDate', type: 'datetime', length: 3 })
	invoiceDate!: Date;

	@Property({ fieldName: 'BillingAddress', type: 'string', length: 70, nullable: true })
	billingAddress?: string;

	@Property({ fieldName: 'BillingCity', type: 'string', length: 40, nullable: true })
	billingCity?: string;

	@Property({ fieldName: 'BillingState', type: 'string', length: 40, nullable: true })
	billingState?: string;

	@Property({ fieldName: 'BillingCountry', type: 'string', length: 40, nullable: true })
	billingCountry?: string;

	@Property({ fieldName: 'BillingPostalCode', type: 'string', length: 10, nullable: true })
	billingPostalCode?: string;

	@Property({ fieldName: 'Total', type: 'decimal' })
	total!: string;

	@OneToMany({ entity: () => InvoiceLine, mappedBy: 'invoice' })
	invoiceLines = new Collection<InvoiceLine>(this);
}
