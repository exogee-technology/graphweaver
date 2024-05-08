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
import { Employee } from './employee';
import { Invoice } from './invoice';

@Entity({ tableName: 'Customer' })
export class Customer extends BaseEntity {
	@PrimaryKey({ fieldName: 'CustomerId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'FirstName', type: 'NVARCHAR(40)' })
	firstName!: unknown;

	@Property({ fieldName: 'LastName', type: 'NVARCHAR(20)' })
	lastName!: unknown;

	@Property({ fieldName: 'Company', type: 'NVARCHAR(80)', nullable: true })
	company?: unknown;

	@Property({ fieldName: 'Address', type: 'NVARCHAR(70)', nullable: true })
	address?: unknown;

	@Property({ fieldName: 'City', type: 'NVARCHAR(40)', nullable: true })
	city?: unknown;

	@Property({ fieldName: 'State', type: 'NVARCHAR(40)', nullable: true })
	state?: unknown;

	@Property({ fieldName: 'Country', type: 'NVARCHAR(40)', nullable: true })
	country?: unknown;

	@Property({ fieldName: 'PostalCode', type: 'NVARCHAR(10)', nullable: true })
	postalCode?: unknown;

	@Property({ fieldName: 'Phone', type: 'NVARCHAR(24)', nullable: true })
	phone?: unknown;

	@Property({ fieldName: 'Fax', type: 'NVARCHAR(24)', nullable: true })
	fax?: unknown;

	@Property({ fieldName: 'Email', type: 'NVARCHAR(60)' })
	email!: unknown;

	@ManyToOne({
		entity: () => Employee,
		ref: true,
		fieldName: 'SupportRepId',
		nullable: true,
		index: 'IFK_CustomerSupportRepId',
	})
	employee?: Ref<Employee>;

	@OneToMany({ entity: () => Invoice, mappedBy: 'customer' })
	invoices = new Collection<Invoice>(this);
}
