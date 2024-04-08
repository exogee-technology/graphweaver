import {
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	RelationshipField,
	SummaryField,
} from '@exogee/graphweaver';
import { ISODateStringScalar } from '@exogee/graphweaver-scalars';
import { Customer } from '../customer';
import { Employee as OrmEmployee } from '../../entities';

@ObjectType('Employee')
export class Employee extends GraphQLEntity<OrmEmployee> {
	public dataEntity!: OrmEmployee;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	lastName!: string;

	@Field(() => String)
	firstName!: string;

	@SummaryField()
	@Field(() => String, { nullable: true })
	title?: string;

	@RelationshipField<Employee>(() => Employee, {
		id: (entity) => entity.employee?.id,
		nullable: true,
	})
	employee?: Employee;

	@Field(() => ISODateStringScalar, { nullable: true })
	birthDate?: Date;

	@Field(() => ISODateStringScalar, { nullable: true })
	hireDate?: Date;

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

	@Field(() => String, { nullable: true })
	email?: string;

	@RelationshipField<Customer>(() => [Customer], { relatedField: 'employee' })
	customers!: Customer[];

	@RelationshipField<Employee>(() => [Employee], { relatedField: 'employee' })
	employees!: Employee[];
}
