import { describe, test } from 'node:test';
import request from 'supertest-graphql';
import gql from 'graphql-tag';
import { config } from '../../../../config';
import { Album } from '..';
import { DialectOptions, setupDialect } from './dialect';

const ALBUMS = gql`
	query Albums($filter: AlbumsListFilter) {
		albums(filter: $filter) {
			albumId
			title
			artist {
				artistId
				name
			}
		}
	}
`;

/** Chinook ships 347 albums, and every dialect's seed is generated from the same source. */
const SEEDED_ALBUMS = 347;

export const basicListSuite = (options: DialectOptions) => {
	describe('basic query', () => {
		setupDialect(options, 'read-only');

		test('should get albums', async () => {
			const { data } = await request<{ albums: Album[] }>(config.baseUrl)
				.query(gql`
					query {
						albums {
							albumId
						}
					}
				`)
				.expectNoErrors();

			expect(data?.albums).toHaveLength(SEEDED_ALBUMS);
		});
	});
};

export const basicFilterSuite = (options: DialectOptions) => {
	describe('basic filter', () => {
		setupDialect(options, 'read-only');

		test('should filter Albums by Artist ID = "Black Sabbath"', async () => {
			// A nested relationship filter, which compiles to a correlated EXISTS rather than a join.
			const { data } = await request<{ albums: Album[] }>(config.baseUrl)
				.query(ALBUMS)
				.variables({ filter: { artist: { name: 'Black Sabbath' } } })
				.expectNoErrors();

			expect(data?.albums).toHaveLength(2);
		});
	});
};

type Employee = { employeeId: string; customers: { customerId: string }[] };

const EMPLOYEES = gql`
	query Employees($filter: EmployeesListFilter) {
		employees(filter: $filter) {
			employeeId
			customers {
				customerId
			}
		}
	}
`;

const REPORTING_LINE = gql`
	query Employees($filter: EmployeesListFilter) {
		employees(filter: $filter) {
			employeeId
		}
	}
`;

export const existsFilterSuite = (options: DialectOptions) => {
	describe('relationship _exists filter', () => {
		setupDialect(options, 'read-only');

		test('partitions rows by whether they have any related records', async () => {
			// Asserted as a partition rather than against counts, because the point is the
			// semantics rather than how many support reps Chinook happens to ship: every employee
			// is on exactly one side, and which side is decided by their own customer list.
			const all = await request<{ employees: Employee[] }>(config.baseUrl)
				.query(EMPLOYEES)
				.expectNoErrors();

			const withNone = await request<{ employees: Employee[] }>(config.baseUrl)
				.query(EMPLOYEES)
				.variables({ filter: { customers_exists: false } })
				.expectNoErrors();

			const withSome = await request<{ employees: Employee[] }>(config.baseUrl)
				.query(EMPLOYEES)
				.variables({ filter: { customers_exists: true } })
				.expectNoErrors();

			const ids = (result: typeof all) => result.data?.employees?.map((e) => e.employeeId) ?? [];

			// Both sides have to be non-empty, or a filter that ignored the condition entirely
			// would pass this.
			expect(ids(withNone).length).toBeGreaterThan(0);
			expect(ids(withSome).length).toBeGreaterThan(0);
			expect([...ids(withNone), ...ids(withSome)].sort()).toEqual([...ids(all)].sort());

			for (const employee of withNone.data?.employees ?? []) {
				expect(employee.customers).toHaveLength(0);
			}
			for (const employee of withSome.data?.employees ?? []) {
				expect(employee.customers.length).toBeGreaterThan(0);
			}
		});

		test('works on a many-to-one, where the foreign key answers it', async () => {
			// Chinook's Employee.ReportsTo points at another employee, and the importer names a
			// many-to-one after its foreign key column. Everyone but the boss reports to someone.
			const reportsToNobody = await request<{ employees: { employeeId: string }[] }>(config.baseUrl)
				.query(REPORTING_LINE)
				.variables({ filter: { reportsTo_exists: false } })
				.expectNoErrors();

			expect(reportsToNobody.data?.employees).toHaveLength(1);

			const reportsToSomeone = await request<{ employees: { employeeId: string }[] }>(
				config.baseUrl
			)
				.query(REPORTING_LINE)
				.variables({ filter: { reportsTo_exists: true } })
				.expectNoErrors();

			expect(reportsToSomeone.data?.employees?.length).toBeGreaterThan(1);
		});
	});
};

export const ilikeFilterSuite = (options: DialectOptions) => {
	describe('ilike operator handling', () => {
		setupDialect(options, 'read-only');

		test('should resolve $ilike to $like', async () => {
			const { data } = await request<{ albums: Album[] }>(config.baseUrl)
				.query(ALBUMS)
				.variables({ filter: { title_ilike: 'The %' } })
				.expectNoErrors();

			expect(data?.albums).toHaveLength(30);

			const likeData = await request<{ albums: Album[] }>(config.baseUrl)
				.query(ALBUMS)
				.variables({ filter: { title_like: 'The %' } })
				.expectNoErrors();

			expect(likeData.data?.albums).toHaveLength(30);
		});
	});
};
