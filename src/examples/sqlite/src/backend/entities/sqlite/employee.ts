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
import { Customer } from './customer';

@Entity({ tableName: 'Employee' })
export class Employee extends BaseEntity {
	@PrimaryKey({ fieldName: 'EmployeeId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'LastName', type: 'NVARCHAR(20)' })
	lastName!: string;

	@Property({ fieldName: 'FirstName', type: 'NVARCHAR(20)' })
	firstName!: string;

	@Property({ fieldName: 'Title', type: 'NVARCHAR(30)', nullable: true })
	title?: string;

	@ManyToOne({
		entity: () => Employee,
		ref: true,
		fieldName: 'ReportsTo',
		nullable: true,
		index: 'IFK_EmployeeReportsTo',
	})
	employee?: Ref<Employee>;

	@Property({ fieldName: 'BirthDate', type: 'Date', nullable: true })
	birthDate?: Date;

	@Property({ fieldName: 'HireDate', type: 'Date', nullable: true })
	hireDate?: Date;

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

	@Property({ fieldName: 'Email', type: 'NVARCHAR(60)', nullable: true })
	email?: string;

	@OneToMany({ entity: () => Customer, mappedBy: 'employee' })
	customers = new Collection<Customer>(this);

	@OneToMany({ entity: () => Employee, mappedBy: 'employee' })
	employees = new Collection<Employee>(this);
}
