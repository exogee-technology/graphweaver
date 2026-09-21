import { describe, expect, it } from 'vitest';
import { renderEntityFile } from '../codegen/entity-file';
import { enumValuesFromCheck } from '../introspection/postgres';
import { buildEntityModels, type EntityModel } from '../introspection/entity-model';
import { snakeCase } from '../mapping/naming';

const entity = (overrides: Partial<EntityModel> = {}): EntityModel => ({
	name: 'Invoice',
	table: 'invoice',
	tableIsConventional: true,
	schema: undefined,
	clientGeneratedPrimaryKeys: false,
	properties: [
		{
			property: 'invoiceId',
			column: 'invoice_id',
			isConventional: true,
			type: 'int',
			sqlType: 'int4',
			nullable: false,
			autoIncrement: true,
			isPrimaryKey: true,
		},
	],
	relationships: [],
	...overrides,
});

describe('enum columns', () => {
	const model = entity({
		properties: [
			...entity().properties,
			{
				property: 'paymentStatus',
				column: 'PaymentStatus',
				isConventional: false,
				type: 'string',
				sqlType: 'text',
				nullable: true,
				autoIncrement: false,
				isPrimaryKey: false,
				enumValues: ['unpaid', 'partially-paid', 'paid'],
			},
		],
	});

	const file = renderEntityFile(model);

	it('declares a TypeScript enum and registers it with core', () => {
		// Without the registration the schema builder has no enum to expose and the field would
		// come out as a String, which is the difference between `PAID` and `"paid"` at the API.
		expect(file).toContain('export enum InvoicePaymentStatus {');
		expect(file).toContain(
			"graphweaverMetadata.collectEnumInformation({ name: 'InvoicePaymentStatus', target: InvoicePaymentStatus });"
		);
		expect(file).toContain('paymentStatus?: InvoicePaymentStatus;');
	});

	it('turns values that are not identifiers into ones that are', () => {
		// 'partially-paid' is a perfectly good column value and not a TypeScript identifier.
		expect(file).toContain("PARTIALLY_PAID = 'partially-paid',");
		expect(file).toContain("PAID = 'paid',");
	});
});

describe('postgres enums expressed as CHECK constraints', () => {
	it('reads the allowed values off the constraint Postgres actually stores', () => {
		// Postgres rewrites `IN ('a', 'b')` to this before storing it, so this is the only shape
		// that ever comes back out of `pg_get_constraintdef`.
		expect(
			enumValuesFromCheck(
				`CHECK (("PaymentStatus" = ANY (ARRAY['unpaid'::text, 'partially-paid'::text, 'paid'::text])))`,
				'PaymentStatus'
			)
		).toEqual(['unpaid', 'partially-paid', 'paid']);
	});

	it('leaves alone a CHECK that is not an enumeration', () => {
		expect(enumValuesFromCheck('CHECK (("Total" > (0)::numeric))', 'Total')).toBeUndefined();
		expect(enumValuesFromCheck(`CHECK (("Start" < "End"))`, 'Start')).toBeUndefined();
	});

	it('ignores a constraint on a different column', () => {
		// The definition names the column it constrains, and the caller pairs it with the first
		// column of `conkey`. If those disagree we are looking at something we do not understand.
		expect(
			enumValuesFromCheck(`CHECK (("Status" = ANY (ARRAY['a'::text])))`, 'Other')
		).toBeUndefined();
	});

	it('unescapes a doubled quote', () => {
		expect(enumValuesFromCheck(`CHECK ((c = ANY (ARRAY['it''s'::text])))`, 'c')).toEqual(["it's"]);
	});
});

describe('naming a many-to-one', () => {
	// Exercised through the introspection pass rather than directly, because the rule only matters
	// in combination with the deduplication that follows it.
	const relationshipsFor = (foreignKeys: { column: string; referencedTable: string }[]) => {
		const table = (name: string, extra: Record<string, unknown> = {}) => ({
			schema: undefined,
			name,
			kind: 'table' as const,
			columns: [
				...new Map(
					[
						{ name: 'id', sqlType: 'int', nullable: false },
						...foreignKeys.map((key) => ({ name: key.column, sqlType: 'int', nullable: true })),
					].map((column) => [column.name, column])
				).values(),
			],
			primaryKey: { name: `${name}_pkey`, columns: ['id'] },
			foreignKeys: [],
			uniques: [],
			indexes: [],
			...extra,
		});

		const schema = {
			dialect: 'postgres' as const,
			tables: [
				table('employee', {
					foreignKeys: foreignKeys.map((key, index) => ({
						name: `fk_${index}`,
						columns: [key.column],
						referencedTable: key.referencedTable,
						referencedColumns: ['id'],
					})),
				}),
				{ ...table('department'), columns: [{ name: 'id', sqlType: 'int', nullable: false }] },
			],
			enums: [],
			warnings: [],
		};

		const { entities } = buildEntityModels(schema as never, snakeCase);

		return entities
			.find((entity) => entity.name === 'Employee')!
			.relationships.filter((relationship) => relationship.kind === 'manyToOne')
			.map((relationship) => relationship.property);
	};

	it('takes the name from the foreign key column, not the table it points at', () => {
		// The whole point: named after its target this would be `employee`, on an entity that is
		// already an employee.
		expect(relationshipsFor([{ column: 'ReportsTo', referencedTable: 'employee' }])).toEqual([
			'reportsTo',
		]);
	});

	it('drops a trailing Id, however the column spells it', () => {
		expect(relationshipsFor([{ column: 'DepartmentId', referencedTable: 'department' }])).toEqual([
			'department',
		]);
		expect(relationshipsFor([{ column: 'department_id', referencedTable: 'department' }])).toEqual([
			'department',
		]);
	});

	it('keeps two keys to the same table apart without a numeric suffix', () => {
		expect(
			relationshipsFor([
				{ column: 'ManagerId', referencedTable: 'employee' },
				{ column: 'MentorId', referencedTable: 'employee' },
			])
		).toEqual(['manager', 'mentor']);
	});

	it('falls back to the table when the column has no name of its own', () => {
		expect(relationshipsFor([{ column: 'id', referencedTable: 'department' }])).toEqual([
			'department',
		]);
	});
});
