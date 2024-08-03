import { BigIntType, Entity, Property } from '@mikro-orm/core';

@Entity({ expression: 'SELECT * FROM TotalInvoicesByCustomer' })
export class TotalInvoicesByCustomer {
	@Property({ fieldName: 'CustomerId', type: new BigIntType('string') })
	customerId!: string;

	@Property({ fieldName: 'Total', type: 'NUMERIC(10,2)' })
	// MikroORM serializes this as a string for precision, but it's a number in the database
	total!: string;
}
