import { BigIntType, Entity, ManyToOne, Property, Ref } from '@mikro-orm/core';
import { Customer } from './customer';

@Entity({ expression: 'SELECT CustomerId, Total FROM TotalInvoicesByCustomer' })
export class TotalInvoicesByCustomer {
	@Property({ fieldName: 'CustomerId', type: new BigIntType('string') })
	customerId!: string;

	@Property({ fieldName: 'Total', type: 'NUMERIC(10,2)' })
	// MikroORM serializes this as a string for precision, but it's a number in the database
	total!: string;

	@ManyToOne({
		entity: () => Customer,
		ref: true,
		fieldName: 'CustomerId',
		nullable: true,
	})
	customer?: Ref<Customer>;
}
