import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Employee } from './employee';
import { Invoice } from './invoice';

@Entity({ tableName: 'Customer' })
export class Customer {
	@PrimaryKey({ fieldName: 'CustomerId', type: 'integer' })
	customerId!: number;

	@Property({ fieldName: 'FirstName', type: 'string', length: 40 })
	firstName!: string;

	@Property({ fieldName: 'LastName', type: 'string', length: 20 })
	lastName!: string;

	@Property({ fieldName: 'Company', type: 'string', length: 80, nullable: true })
	company?: string;

	@Property({ fieldName: 'Address', type: 'string', length: 70, nullable: true })
	address?: string;

	@Property({ fieldName: 'City', type: 'string', length: 40, nullable: true })
	city?: string;

	@Property({ fieldName: 'State', type: 'string', length: 40, nullable: true })
	state?: string;

	@Property({ fieldName: 'Country', type: 'string', length: 40, nullable: true })
	country?: string;

	@Property({ fieldName: 'PostalCode', type: 'string', length: 10, nullable: true })
	postalCode?: string;

	@Property({ fieldName: 'Phone', type: 'string', length: 24, nullable: true })
	phone?: string;

	@Property({ fieldName: 'Fax', type: 'string', length: 24, nullable: true })
	fax?: string;

	@Property({ fieldName: 'Email', type: 'string', length: 60 })
	email!: string;

	@ManyToOne({ entity: () => Employee, ref: true, fieldName: 'SupportRepId', nullable: true, index: 'IFK_CustomerSupportRepId' })
	employee?: Ref<Employee>;

	@OneToMany({ entity: () => Invoice, mappedBy: 'customer' })
	invoices = new Collection<Invoice>(this);
}
