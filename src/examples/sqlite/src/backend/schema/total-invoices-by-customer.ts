import { Entity, ID } from '@exogee/graphweaver';
import { connection } from '../database';
import { Customer } from './customer';
import { Field, ManyToOne, SqlDataProvider } from '@exogee/graphweaver-sql';

// Note: This entity is backed by a view. It allows filtering, pagination, and sorting as per normal
//       but it is not writeable, hence the apiOptions below.
@Entity('TotalInvoicesByCustomer', {
	provider: new SqlDataProvider(() => TotalInvoicesByCustomer, connection),
	apiOptions: { excludeFromBuiltInWriteOperations: true },
})
export class TotalInvoicesByCustomer {
	@Field(() => ID, { column: 'CustomerId', primaryKeyField: true })
	customerId!: string;

	@Field(() => String, { column: 'Total' })
	total!: string;

	@ManyToOne(() => Customer, { column: 'CustomerId' })
	customer!: Customer;
}
