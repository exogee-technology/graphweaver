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
	firstName!: string;

	@Property({ fieldName: 'LastName', type: 'NVARCHAR(20)' })
	lastName!: string;

	@Property({ fieldName: 'Company', type: 'NVARCHAR(80)', nullable: true })
	company?: string;

	@Property({ fieldName: 'Address', type: 'NVARCHAR(70)', nullable: true })
	address?: string;

	@Property({ fieldName: 'City', type: 'NVARCHAR(40)', nullable: true })
	city?: string;

	@Property({ fieldName: 'State', type: 'NVARCHAR(40)', nullable: true })
	state?: string;

	@Property({ fieldName: 'Country', type: 'NVARCHAR(40)', nullable: true })
	country?: string;

	@Property({ fieldName: 'PostalCode', type: 'NVARCHAR(10)', nullable: true })
	postalCode?: string;

	@Property({ fieldName: 'Phone', type: 'NVARCHAR(24)', nullable: true })
	phone?: string;

	@Property({ fieldName: 'Fax', type: 'NVARCHAR(24)', nullable: true })
	fax?: string;

	@Property({ fieldName: 'Email', type: 'NVARCHAR(60)' })
	email!: string;

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
