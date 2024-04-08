import { Field, GraphQLEntity, ID, ObjectType, RelationshipField } from '@exogee/graphweaver';
import { Employee } from '../employee';
import { Invoice } from '../invoice';
import { Customer as OrmCustomer } from '../../entities';

@ObjectType('Customer')
export class Customer extends GraphQLEntity<OrmCustomer> {
	public dataEntity!: OrmCustomer;

	@Field(() => ID)
	id!: number;

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

	@RelationshipField<Customer>(() => Employee, {
		id: (entity) => entity.employee?.id,
		nullable: true,
	})
	employee?: Employee;

	@RelationshipField<Invoice>(() => [Invoice], { relatedField: 'customer' })
	invoices!: Invoice[];
}
