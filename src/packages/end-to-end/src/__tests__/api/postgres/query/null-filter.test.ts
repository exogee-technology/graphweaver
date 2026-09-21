import { describe, test } from 'node:test';
import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { config } from '../../../../config';

describe('null filter', () => {
	test('should filter by Customers with company_null = true', async () => {
		const { data } = await request<{ customers: any }>(config.baseUrl)
			.query(gql`
				query Customers($filter: CustomersListFilter) {
					customers(filter: $filter) {
						customerId
						company
					}
				}
			`)
			.variables({
				filter: {
					company_null: true,
				},
			})
			.expectNoErrors();

		expect(data?.customers).toHaveLength(49);
		expect(data?.customers?.[0]?.company).toBeNull();
	});

	test('should filter by Customers with company_notnull = true', async () => {
		const { data } = await request<{ customers: any }>(config.baseUrl)
			.query(gql`
				query Customers($filter: CustomersListFilter) {
					customers(filter: $filter) {
						customerId
						company
					}
				}
			`)
			.variables({
				filter: {
					company_notnull: true,
				},
			})
			.expectNoErrors();

		expect(data?.customers).toHaveLength(10);
		expect(data?.customers?.[0]?.company).not.toBeNull();
	});

	test('should filter by Customers with company = null', async () => {
		const { data } = await request<{ customers: any }>(config.baseUrl)
			.query(gql`
				query Customers($filter: CustomersListFilter) {
					customers(filter: $filter) {
						customerId
						company
					}
				}
			`)
			.variables({
				filter: {
					company: null,
				},
			})
			.expectNoErrors();

		expect(data?.customers).toHaveLength(49);
		expect(data?.customers?.[0]?.company).toBeNull();
	});

	test('should filter by Customers with company_null = false AND company = JetBrains s.r.o.', async () => {
		const { data } = await request<{ customers: any }>(config.baseUrl)
			.query(gql`
				query Customers($filter: CustomersListFilter) {
					customers(filter: $filter) {
						customerId
						company
					}
				}
			`)
			.variables({
				filter: {
					company_null: false,
					company: 'JetBrains s.r.o.',
				},
			})
			.expectNoErrors();

		expect(data?.customers).toHaveLength(1);
		expect(data?.customers?.[0]?.company).toBe('JetBrains s.r.o.');
	});

	test('should filter by Customers with company_null = false AND company in [JetBrains s.r.o.]', async () => {
		const { data } = await request<{ customers: any }>(config.baseUrl)
			.query(gql`
				query Customers($filter: CustomersListFilter) {
					customers(filter: $filter) {
						customerId
						company
					}
				}
			`)
			.variables({
				filter: {
					company_null: false,
					company_in: ['JetBrains s.r.o.'],
				},
			})
			.expectNoErrors();

		expect(data?.customers).toHaveLength(1);
		expect(data?.customers?.[0]?.company).toBe('JetBrains s.r.o.');
	});

	test('should get all employees who dont have customers', async () => {
		const { data } = await request<{ employees: any }>(config.baseUrl)
			.query(gql`
				query Employees($filter: EmployeesListFilter) {
					employees(filter: $filter) {
						employeeId
						customers {
							customerId
						}
					}
				}
			`)
			// Negating a condition every customer satisfies, rather than the `customerId_null: true`
			// this used to send. That was the LEFT JOIN idiom the MikroORM provider compiled to;
			// against the correlated EXISTS this provider generates it asks for a customer whose
			// primary key is null, which matches nothing.
			// `SqlDataProvider.treatRelationshipNullAsAbsent` brings the old reading back for
			// projects that cannot rewrite their filters.
			//
			// Not the tidier `_not: { customers: {} }`: core's `cleanFilter` drops empty filter
			// objects, so that one never reaches the provider and every employee matches.
			.variables({ filter: { _not: { customers: { customerId_null: false } } } })
			.expectNoErrors();

		expect(data?.employees).toHaveLength(5);
		data?.employees.forEach((employee: any) => {
			expect(employee.customers).toHaveLength(0);
		});
	});

	test('Should get all employees who have at least one customer with a fax', async () => {
		const { data } = await request<{ employees: any }>(config.baseUrl)
			.query(gql`
				query Employees($filter: EmployeesListFilter) {
					employees(filter: $filter) {
						employeeId
						customers {
							customerId
							fax
						}
					}
				}
			`)
			.variables({
				filter: {
					customers: {
						fax_null: false,
					},
				},
			})
			.expectNoErrors();

		expect(data?.employees).toHaveLength(3);
		data?.employees.forEach((employee: any) => {
			const hasFax = employee.customers.some((customer: any) => customer.fax !== null);
			expect(hasFax).toBe(true);
		});
	});
});
