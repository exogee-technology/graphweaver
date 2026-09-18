import { Entity, ID } from '@exogee/graphweaver';
import { ISODateStringScalar } from '@exogee/graphweaver-scalars';
import { Customer } from './customer';
import { connection } from '../database';
import { Field, ManyToOne, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity<Employee>('Employee', {
	provider: new SqlDataProvider(() => Employee, connection, {
		table: 'Employee',
		backendDisplayName: 'SQL Server',
	}),
})
export class Employee {
	@Field(() => ID, { column: 'EmployeeId', primaryKeyField: true })
	employeeId!: number;

	@Field(() => String, { column: 'LastName' })
	lastName!: string;

	@Field(() => String, { column: 'FirstName' })
	firstName!: string;

	@Field(() => String, { column: 'Title', nullable: true, adminUIOptions: { summaryField: true } })
	title?: string;

	@ManyToOne(() => Employee, { column: 'ReportsTo', nullable: true })
	employee?: Employee;

	@Field(() => ISODateStringScalar, { column: 'BirthDate', nullable: true })
	birthDate?: Date;

	@Field(() => ISODateStringScalar, { column: 'HireDate', nullable: true })
	hireDate?: Date;

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

	@Field(() => String, { column: 'Email', nullable: true })
	email?: string;

	@OneToMany(() => [Customer], { relatedField: 'employee' })
	customers!: Customer[];

	@OneToMany(() => [Employee], { relatedField: 'employee' })
	employees!: Employee[];
}
