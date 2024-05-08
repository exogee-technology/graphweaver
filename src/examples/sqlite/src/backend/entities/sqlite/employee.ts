import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Customer } from './customer';

@Entity({ tableName: 'Employee' })
export class Employee extends BaseEntity {
	@PrimaryKey({ fieldName: 'EmployeeId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'LastName', type: 'NVARCHAR(20)' })
	lastName!: unknown;

	@Property({ fieldName: 'FirstName', type: 'NVARCHAR(20)' })
	firstName!: unknown;

	@Property({ fieldName: 'Title', type: 'NVARCHAR(30)', nullable: true })
	title?: unknown;

	@ManyToOne({ entity: () => Employee, ref: true, fieldName: 'ReportsTo', nullable: true, index: 'IFK_EmployeeReportsTo' })
	employee?: Ref<Employee>;

	@Property({ fieldName: 'BirthDate', type: 'Date', nullable: true })
	birthDate?: Date;

	@Property({ fieldName: 'HireDate', type: 'Date', nullable: true })
	hireDate?: Date;

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

	@Property({ fieldName: 'Email', type: 'NVARCHAR(60)', nullable: true })
	email?: unknown;

	@OneToMany({ entity: () => Customer, mappedBy: 'employee' })
	customers = new Collection<Customer>(this);

	@OneToMany({ entity: () => Employee, mappedBy: 'employee' })
	employees = new Collection<Employee>(this);
}
