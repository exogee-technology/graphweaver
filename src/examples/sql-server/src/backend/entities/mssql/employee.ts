import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Customer } from './customer';

@Entity({ tableName: 'Employee' })
export class Employee {
	@PrimaryKey({ fieldName: 'EmployeeId', type: 'integer' })
	employeeId!: number;

	@Property({ fieldName: 'LastName', type: 'string', length: 20 })
	lastName!: string;

	@Property({ fieldName: 'FirstName', type: 'string', length: 20 })
	firstName!: string;

	@Property({ fieldName: 'Title', type: 'string', length: 30, nullable: true })
	title?: string;

	@ManyToOne({ entity: () => Employee, ref: true, fieldName: 'ReportsTo', nullable: true, index: 'IFK_EmployeeReportsTo' })
	employee?: Ref<Employee>;

	@Property({ fieldName: 'BirthDate', type: 'datetime', length: 3, nullable: true })
	birthDate?: Date;

	@Property({ fieldName: 'HireDate', type: 'datetime', length: 3, nullable: true })
	hireDate?: Date;

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

	@Property({ fieldName: 'Email', type: 'string', length: 60, nullable: true })
	email?: string;

	@OneToMany({ entity: () => Customer, mappedBy: 'employee' })
	customers = new Collection<Customer>(this);

	@OneToMany({ entity: () => Employee, mappedBy: 'employee' })
	employees = new Collection<Employee>(this);
}
