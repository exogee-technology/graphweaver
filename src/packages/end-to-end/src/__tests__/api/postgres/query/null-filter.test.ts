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

		expect(data?.customers).toHaveLength(49);
		expect(data?.customers?.[0]?.company).toBeNull();
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
			.variables({
				filter: {
					customers: {
						customerId_null: true,
					},
				},
			})
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
