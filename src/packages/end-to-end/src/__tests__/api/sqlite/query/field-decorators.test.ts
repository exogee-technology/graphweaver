import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity, Property, PrimaryKey } from '@mikro-orm/core';
import {
	createBaseResolver,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	Resolver,
	ReadOnlyProperty,
} from '@exogee/graphweaver';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Schema } from '@exogee/graphweaver-admin-ui-components';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@Entity({ tableName: 'Customer' })
export class OrmCustomer extends BaseEntity {
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
}

@ObjectType('Customer')
export class Customer extends GraphQLEntity<OrmCustomer> {
	public dataEntity!: OrmCustomer;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	firstName!: string;

	@Field(() => String)
	lastName!: string;

	@ReadOnlyProperty()
	@Field(() => String, { nullable: true })
	company?: string;

	@ReadOnlyProperty()
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
}

const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [OrmCustomer],
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
	},
};

@Resolver((of) => Customer)
export class CustomerResolver extends createBaseResolver<Customer, OrmCustomer>(
	Customer,
	new MikroBackendProvider(OrmCustomer, connection)
) {}

test('Should return isReadOnly attribute for each entity in getAdminUiMetadata', async () => {
	const graphweaver = new Graphweaver({
		resolvers: [CustomerResolver],
	});

	const response = await graphweaver.server.executeOperation({
		query: gql`
			{
				result: _graphweaver {
					entities {
						name
						backendId
						summaryField
						fields {
							name
							type
							relationshipType
							relatedEntity
							filter {
								type
								__typename
							}
							attributes {
								isReadOnly
								__typename
							}
							__typename
						}
						attributes {
							isReadOnly
							__typename
						}
						__typename
					}
					enums {
						name
						values {
							name
							value
							__typename
						}
						__typename
					}
					__typename
				}
			}
		`,
	});
	assert(response.body.kind === 'single');
	const result = response.body.singleResult.data?.result as unknown as Schema;
	expect(result.entities).toHaveLength(1);

	const customerEntity = result.entities.find((entity) => entity.name === 'Customer');
	expect(customerEntity).not.toBeNull();

	const fieldNameField = customerEntity?.fields.find((field) => field.name === 'firstName');
	expect(fieldNameField).not.toBeNull();
	expect(fieldNameField?.attributes).toBeNull();

	const companyField = customerEntity?.fields.find((field) => field.name === 'company');
	expect(companyField).not.toBeNull();
	expect(companyField?.attributes).not.toBeNull();
	expect(companyField?.attributes?.isReadOnly).toEqual(true);

	const addressField = customerEntity?.fields.find((field) => field.name === 'address');
	expect(addressField).not.toBeNull();
	expect(addressField?.attributes).not.toBeNull();
	expect(addressField?.attributes?.isReadOnly).toEqual(true);
});
