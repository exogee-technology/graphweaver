import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity as DataEntity, Property, PrimaryKey } from '@mikro-orm/core';
import { Field, ID, Entity, AdminUiEntityMetadata } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@DataEntity({ tableName: 'Customer' })
export class OrmCustomer {
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
}

const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [OrmCustomer],
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
	},
};

@Entity('Customer', {
	provider: new MikroBackendProvider(OrmCustomer, connection),
})
export class Customer {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	firstName!: string;

	@Field(() => String)
	lastName!: string;

	@Field(() => String, { nullable: true, adminUIOptions: { readonly: true } })
	company?: string;

	@Field(() => String, { nullable: true, adminUIOptions: { readonly: true } })
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

test('Should return isReadOnly attribute for each field in getAdminUiMetadata', async () => {
	const graphweaver = new Graphweaver();
	await ConnectionManager.connect('sqlite', connection);

	const response = await graphweaver.executeOperation<{
		result: {
			entities: AdminUiEntityMetadata[];
		};
	}>({
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
								isRequired
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
	const result = response.body.singleResult.data?.result;
	expect(result?.entities).toHaveLength(10);

	const customerEntity = result?.entities.find((entity) => entity.name === 'Customer');
	expect(customerEntity).not.toBeNull();

	const fieldNameField = customerEntity?.fields?.find((field) => field.name === 'firstName');
	expect(fieldNameField).not.toBeNull();
	expect(fieldNameField?.attributes).not.toBeNull();
	expect(fieldNameField?.attributes?.isReadOnly).toEqual(false);
	expect(fieldNameField?.attributes?.isRequired).toEqual(true);

	const companyField = customerEntity?.fields?.find((field) => field.name === 'company');
	expect(companyField).not.toBeNull();
	expect(companyField?.attributes).not.toBeNull();
	expect(companyField?.attributes?.isReadOnly).toEqual(true);
	expect(companyField?.attributes?.isRequired).toEqual(false);

	const addressField = customerEntity?.fields?.find((field) => field.name === 'address');
	expect(addressField).not.toBeNull();
	expect(addressField?.attributes).not.toBeNull();
	expect(addressField?.attributes?.isReadOnly).toEqual(true);
	expect(addressField?.attributes?.isRequired).toEqual(false);
});
