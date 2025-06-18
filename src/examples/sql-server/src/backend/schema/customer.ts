import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Employee } from './employee';
import { Invoice } from './invoice';
import { Customer as OrmCustomer } from '../entities';
import { connection } from '../database';

@Entity<Customer>('Customer', {
	provider: new MikroBackendProvider(OrmCustomer, connection, { backendDisplayName: 'SQL Server' }),
})
export class Customer {
	@Field(() => ID, { primaryKeyField: true })
	customerId!: number;

	@Field(() => String)
	firstName!: string;

	@Field(() => String)
	lastName!: string;

	@Field(() => String, { nullable: true })
	company?: string;

	@Field(() => String, { nullable: true })
	address?: string;

	@Field(() => String, { nullable: true })
	city?: string;

	@Field(() => String, { nullable: true })
	state?: string;

	@Field(() => String, { nullable: true })
	country?: string;

	@Field(() => String, { nullable: true })
	postalCode?: string;

	@Field(() => String, { nullable: true })
	phone?: string;

	@Field(() => String, { nullable: true })
	fax?: string;

	@Field(() => String)
	email!: string;

	@RelationshipField<Customer>(() => Employee, { id: (entity) => entity.employee?.employeeId, nullable: true })
	employee?: Employee;

	@RelationshipField<Invoice>(() => [Invoice], { relatedField: 'customer' })
	invoices!: Invoice[];
}
