import { Entity, ID } from '@exogee/graphweaver';
import { Employee } from './employee';
import { Invoice } from './invoice';
import { connection } from '../database';
import { Field, ManyToOne, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity<Customer>('Customer', {
	provider: new SqlDataProvider(() => Customer, connection, {
		table: 'Customer',
		backendDisplayName: 'SQL Server',
	}),
})
export class Customer {
	@Field(() => ID, { column: 'CustomerId', primaryKeyField: true })
	customerId!: number;

	@Field(() => String, { column: 'FirstName' })
	firstName!: string;

	@Field(() => String, { column: 'LastName' })
	lastName!: string;

	@Field(() => String, { column: 'Company', nullable: true })
	company?: string;

	@Field(() => String, { column: 'Address', nullable: true })
	address?: string;

	@Field(() => String, { column: 'City', nullable: true })
	city?: string;

	@Field(() => String, { column: 'State', nullable: true })
	state?: string;

	@Field(() => String, { column: 'Country', nullable: true })
	country?: string;

	@Field(() => String, { column: 'PostalCode', nullable: true })
	postalCode?: string;

	@Field(() => String, { column: 'Phone', nullable: true })
	phone?: string;

	@Field(() => String, { column: 'Fax', nullable: true })
	fax?: string;

	@Field(() => String, { column: 'Email' })
	email!: string;

	@ManyToOne(() => Employee, { column: 'SupportRepId', nullable: true })
	employee?: Employee;

	@OneToMany(() => [Invoice], { relatedField: 'customer' })
	invoices!: Invoice[];
}
