import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { connection } from '../database';
import { TotalInvoicesByCustomer as OrmTotalInvoicesByCustomer } from '../entities';
import { Customer } from './customer';

// Note: This entity is backed by a view. It allows filtering, pagination, and sorting as per normal
//       but it is not writeable, hence the apiOptions below.
@Entity('TotalInvoicesByCustomer', {
	provider: new MikroBackendProvider(OrmTotalInvoicesByCustomer, connection),
	apiOptions: { excludeFromBuiltInWriteOperations: true },
})
export class TotalInvoicesByCustomer {
	@Field(() => ID, { primaryKeyField: true })
	customerId!: string;

	@Field(() => String)
	total!: string;

	@RelationshipField<TotalInvoicesByCustomer>(() => Customer, { id: (row) => row.customerId })
	customer!: Customer;
}
