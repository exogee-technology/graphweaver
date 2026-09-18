import { logger } from '@exogee/logger';
import {
	AggregationType,
	graphweaverMetadata,
	RELATED_ID_KEYS,
	type AggregationResult,
	type BackendProvider,
	type BackendProviderConfig,
	type EntityMetadata,
	type Filter,
	type PaginationOptions,
} from '@exogee/graphweaver';
import { compile } from './compile/compiler';
import { filterCompatibility } from './filter/compatibility';
import type { SqlConnection } from './connection/connection';
import type { Row } from './connection/driver';
import { FOREIGN_KEYS } from './decorators';
import type { HiddenColumns } from './decorators/types';
import { IsolationLevel } from './dialect/dialect';
import { and, param } from './ir/builders';
import type { ColumnType, Expr, Predicate } from './ir/nodes';
import { registerMappingOptions, resolveEntityCached } from './mapping/registry';
import type { ResolveOptions } from './mapping/resolve';
import type {
	ResolvedColumn,
	ResolvedEntity,
	ResolvedManyToMany,
	ResolvedOneToMany,
} from './mapping/types';
import { planCount, planFind, ROOT_ALIAS } from './plan/select';
import { planFindByRelatedId, RELATED_KEY } from './plan/related';

export interface SqlProviderOptions<H = object> extends Omit<ResolveOptions, 'hidden'> {
	/** Columns that exist in the database but not in the GraphQL schema. */
	hidden?: HiddenColumns<H>;
	backendDisplayName?: string;
	isolationLevel?: IsolationLevel;
}

/**
 * A Graphweaver data provider that generates its own SQL.
 *
 * `G` is the entity as the API sees it and `H` is anything stored but not exposed, so the provider
 * reads and writes `G & H` -- which is what lets a custom mutation touch a password hash without
 * the field ever reaching the schema.
 */
export class SqlDataProvider<
	G extends object,
	H extends object = object,
> implements BackendProvider<G & H> {
	/**
	 * Read `{ customers: { customerId_null: true } }` on a to-many as "has no customers".
	 *
	 * Off by default, and the default is the literal reading: that filter asks for a customer whose
	 * primary key is null, which a NOT NULL column can never satisfy, so it matches nothing.
	 *
	 * Without this flag, "has no customers" is `{ customers_exists: false }`, which is what you
	 * want in new code either way -- it says what it means, and it works on a many-to-one too.
	 *
	 * Turn this on if you are migrating from `@exogee/graphweaver-mikroorm` and have filters
	 * written the old way. That provider compiled relationship filters to a LEFT JOIN, where an
	 * employee with no customers appears once with every customer column null -- so the idiom
	 * worked there, and queries carrying it will otherwise start returning nothing rather than
	 * failing. Global rather than per provider because a filter crosses entities, and the same
	 * shape has to mean the same thing on both sides of one.
	 *
	 *     SqlDataProvider.treatRelationshipNullAsAbsent = true;
	 */
	static get treatRelationshipNullAsAbsent(): boolean {
		return filterCompatibility.treatRelationshipNullAsAbsent;
	}

	static set treatRelationshipNullAsAbsent(value: boolean) {
		filterCompatibility.treatRelationshipNullAsAbsent = value;
	}

	readonly backendId: string;
	readonly backendDisplayName?: string;
	readonly connection: SqlConnection;

	#entityThunk: () => new (...args: any[]) => G;
	#options: SqlProviderOptions<H>;
	#resolved?: ResolvedEntity;
	#extraColumns: ReadonlySet<string>;

	constructor(
		/**
		 * A thunk, because the provider is constructed while evaluating the `@Entity` decorator's
		 * argument -- before the class binding it names has been initialised.
		 */
		entity: () => new (...args: any[]) => G,
		connection: SqlConnection,
		options: SqlProviderOptions<H> = {},
		extraColumns: ReadonlySet<string> = new Set()
	) {
		this.#entityThunk = entity;
		this.#options = options;

		// Queued from the constructor rather than applied on first use, so that these options are
		// in place before anything resolves this entity -- including a *different* entity that
		// names it as a relationship target. The name goes in as a thunk because the class binding
		// this provider was handed does not exist yet.
		registerMappingOptions(() => this.entityType.name, {
			// A per-entity override wins, otherwise the whole connection's strategy applies.
			namingStrategy: connection.namingStrategy,
			...(options as ResolveOptions),
		});
		this.#extraColumns = extraColumns;
		this.connection = connection;
		this.backendId = `sql-${connection.id}`;
		// Most specific wins: this entity, then the connection it is on, then the dialect.
		this.backendDisplayName =
			options.backendDisplayName ?? connection.displayName ?? connection.dialect.displayName;
	}

	/**
	 * Core wants `new () => G & H`, but the class only ever declares `G`: hidden columns are
	 * deliberately not class properties, which is the whole point of declaring them separately.
	 * Nothing constructs this -- core only uses it for identity and to look metadata up -- so the
	 * cast costs nothing at runtime.
	 */
	get entityType(): new () => G & H {
		return this.#entityThunk() as unknown as new () => G & H;
	}

	readonly backendProviderConfig: BackendProviderConfig = {
		filter: true,
		pagination: true,
		orderBy: true,
		supportedAggregationTypes: new Set([AggregationType.COUNT]),
		supportsPseudoCursorPagination: true,
		supportsRelationshipExistsFilter: true,
	};

	get maxDataLoaderBatchSize() {
		// Dialect supplied, because SQL Server's 2100 bound parameter ceiling is a hard error
		// rather than a slow query.
		return this.connection.dialect.maxDataLoaderBatchSize;
	}

	/**
	 * Loads columns declared `select: false` for this query.
	 *
	 * Returns a provider view rather than mutating, so asking for a password hash in one code path
	 * cannot widen the SELECT list everywhere else.
	 */
	withColumns(properties: readonly string[]): SqlDataProvider<G, H> {
		return new SqlDataProvider<G, H>(
			this.#entityThunk,
			this.connection,
			this.#options,
			new Set([...this.#extraColumns, ...properties])
		);
	}

	get entityMetadata(): EntityMetadata<any, any> {
		const metadata = graphweaverMetadata.getEntityByName(this.entityType.name);

		if (!metadata) {
			throw new Error(
				`No Graphweaver metadata for '${this.entityType.name}'. Is it decorated with @Entity?`
			);
		}

		return metadata as EntityMetadata<any, any>;
	}

	/** Resolved lazily: related entity classes may not exist yet when the provider is built. */
	get mapping(): ResolvedEntity {
		this.#resolved ??= resolveEntityCached(this.entityMetadata);
		return this.#resolved;
	}

	// ---------------------------------------------------------------- reads

	async find(
		filter: Filter<G & H>,
		pagination?: PaginationOptions,
		_entityMetadata?: EntityMetadata
	): Promise<(G & H)[]> {
		const node = planFind(this.mapping, filter, pagination, this.#extraColumns);
		const { rows } = await this.connection.query(compile(node, this.connection.dialect));

		return rows.map((row) => this.#hydrate(row));
	}

	async findOne(filter: Filter<G & H>): Promise<(G & H) | null> {
		const [first] = await this.find(filter, { limit: 1 } as PaginationOptions);
		return first ?? null;
	}

	async findByRelatedId(
		_entity: new () => G & H,
		relatedField: string,
		relatedIds: readonly string[],
		filter?: Filter<G & H>
	): Promise<(G & H)[]> {
		const plan = planFindByRelatedId(
			this.mapping,
			relatedField,
			relatedIds,
			filter,
			this.#extraColumns
		);

		const { rows } = await this.connection.query(compile(plan.select, this.connection.dialect));

		if (!plan.grouped) {
			return rows.map((row) => this.#hydrate(row, [String(row[RELATED_KEY])]));
		}

		// A join shape returns one row per parent matched, so collapse them back to one record
		// carrying every key it matched.
		const byPrimaryKey = new Map<string, { row: Row; keys: string[] }>();

		for (const row of rows) {
			const id = String(row[this.mapping.primaryKey.name]);
			const existing = byPrimaryKey.get(id);

			if (existing) existing.keys.push(String(row[RELATED_KEY]));
			else byPrimaryKey.set(id, { row, keys: [String(row[RELATED_KEY])] });
		}

		return [...byPrimaryKey.values()].map(({ row, keys }) => this.#hydrate(row, keys));
	}

	async aggregate(
		filter: Filter<G & H> | undefined,
		requestedAggregations: Set<AggregationType>
	): Promise<AggregationResult> {
		if (!requestedAggregations.has(AggregationType.COUNT)) return {};

		const { rows } = await this.connection.query<{ count: number | string }>(
			compile(planCount(this.mapping, filter), this.connection.dialect)
		);

		return { count: Number(rows[0]?.count ?? 0) };
	}

	// ----------------------------------------------------------- hydration

	/**
	 * Turns a result row into an entity.
	 *
	 * Foreign keys and related-id keys both go on symbols rather than properties. Core treats a
	 * defined `source[field]` as already resolved and returns it verbatim, so putting a stub on
	 * `row.album` would starve every other field on the related entity and skip the access control
	 * filters that run with the dataloader.
	 */
	#hydrate(row: Row, relatedIdKeys?: string[]): G & H {
		const { marshaller } = this.connection.driver;
		const entity: Record<string | symbol, unknown> = {};

		for (const column of this.mapping.columns.values()) {
			if (!(column.name in row)) continue;
			entity[column.property] = marshaller.fromDatabase(row[column.name], column.type, column.meta);
		}

		const foreignKeys: Record<string, unknown> = {};

		for (const relationship of this.mapping.relationships.values()) {
			if (relationship.kind !== 'manyToOne') continue;
			if (!(relationship.foreignKey.name in row)) continue;

			foreignKeys[relationship.property] = marshaller.fromDatabase(
				row[relationship.foreignKey.name],
				relationship.foreignKey.type
			);
		}

		Object.defineProperty(entity, FOREIGN_KEYS, { value: foreignKeys, enumerable: false });

		if (relatedIdKeys) {
			Object.defineProperty(entity, RELATED_ID_KEYS, {
				value: relatedIdKeys,
				enumerable: false,
			});
		}

		return entity as G & H;
	}

	// --------------------------------------------------------- transactions

	async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
		return this.connection.transactional(callback, this.#options.isolationLevel);
	}

	// --------------------------------------------------------------- writes

	/**
	 * Splits a write payload into column assignments, resolving relationships to foreign keys.
	 *
	 * Values are left as they are: marshalling happens once, at the driver boundary, because that
	 * is the only place every value goes through. Doing it here as well used to mean a JSON column
	 * was encoded twice on SQL Server, while filter values were never encoded at all.
	 */
	#assignments(input: Partial<G & H>) {
		const assignments: { column: ResolvedColumn; value: Expr }[] = [];

		for (const [property, raw] of Object.entries(input)) {
			const column = this.mapping.columns.get(property);

			if (column) {
				// Never write a column the database generates. Users cannot change an identity
				// primary key, and SQL Server errors even on a no-op assignment to one.
				if (column.generated === 'identity' || column.generated === 'always') continue;

				assignments.push({ column, value: param(raw, column.type, column.meta) });
				continue;
			}

			const relationship = this.mapping.relationships.get(property);
			if (!relationship) continue;

			// Only many-to-one is expressible as a column on this row. The other two live in the
			// related table or the pivot, and are handled separately.
			if (relationship.kind !== 'manyToOne') continue;

			const target = relationship.target();
			const value =
				raw === null || raw === undefined
					? null
					: (raw as Record<string, unknown>)[target.primaryKey.property];

			assignments.push({
				column: relationship.foreignKey,
				value: param(value, relationship.foreignKey.type),
			});
		}

		return assignments;
	}

	/**
	 * The columns a read returns: every selectable column plus the foreign keys, which live on the
	 * relationships rather than the column map. An INSERT has to return the same set, or a created
	 * entity comes back without the foreign keys a found one would have.
	 */
	#readableColumnNames(): string[] {
		const names = [...this.mapping.columns.values()]
			.filter((column) => column.select !== false || this.#extraColumns.has(column.property))
			.map((column) => column.name);

		for (const relationship of this.mapping.relationships.values()) {
			if (relationship.kind === 'manyToOne') names.push(relationship.foreignKey.name);
		}

		return names;
	}

	async createOne(input: Partial<G & H>): Promise<G & H> {
		const [created] = await this.createMany([input]);
		return created;
	}

	async createMany(inputs: Partial<G & H>[]): Promise<(G & H)[]> {
		if (inputs.length === 0) return [];

		return this.withTransaction(async () => {
			const created = new Array<G & H>(inputs.length);

			// Grouped by column shape: a VALUES list cannot mix differing column sets.
			for (const group of groupByShape(inputs, (input) => this.#assignments(input))) {
				const rows = await this.#insertGroup(group.columns, group.rows);

				// Put each row back where its input was. Core pairs createMany's results with its
				// inputs by position to wire up foreign keys, so grouping must not reorder them.
				group.indices.forEach((index, position) => {
					created[index] = rows[position];
				});
			}

			const primaryKey = this.mapping.primaryKey.property as keyof (G & H);
			for (const [index, input] of inputs.entries()) {
				await this.#linkRelationships(created[index][primaryKey], input);
			}

			return created;
		});
	}

	/**
	 * Writes OpenTelemetry spans.
	 *
	 * Deliberately not routed through `createMany`: that opens a transaction and, once auditing
	 * lands, would record the write -- and tracing the act of storing a trace is a loop. Core's
	 * exporter also calls this from inside a suppressed tracing context, so it must stay cheap.
	 */
	async createTraces(inputs: Partial<G & H>[]): Promise<(G & H)[]> {
		if (inputs.length === 0) return [];

		const created: (G & H)[] = [];
		for (const group of groupByShape(inputs, (input) => this.#assignments(input))) {
			created.push(...(await this.#insertGroup(group.columns, group.rows)));
		}

		return created;
	}

	async #insertGroup(columns: ResolvedColumn[], rows: Expr[][]): Promise<(G & H)[]> {
		const { dialect } = this.connection;
		const returning =
			dialect.insertKeyStrategy === 'insertId' ? undefined : this.#readableColumnNames();

		const insert = (batch: Expr[][]) =>
			this.connection.query(
				compile(
					{
						kind: 'insert' as const,
						into: { schema: this.mapping.schema, name: this.mapping.table, alias: ROOT_ALIAS },
						columns: columns.map((column) => column.name),
						rows: batch,
						returning,
					},
					dialect
				)
			);

		// Each row contributes one parameter per column, so a wide table hits SQL Server's ceiling
		// after only a few dozen rows. MySQL's insertId recovery needs a single statement to have
		// allocated the whole contiguous range, so it stays on one -- which is safe because its
		// ceiling is high enough that the batch sizes core sends never approach it.
		const batches =
			dialect.insertKeyStrategy === 'insertId'
				? [rows]
				: chunkForParameters(rows, dialect.maxBindParameters, Math.max(1, columns.length));

		const result = { rows: [] as Row[], rowCount: 0, insertId: undefined as unknown };

		for (const batch of batches) {
			const batchResult = await insert(batch);
			result.rows.push(...batchResult.rows);
			result.rowCount += batchResult.rowCount;
			result.insertId ??= batchResult.insertId;
		}

		if (dialect.insertKeyStrategy !== 'insertId') {
			return result.rows.map((row) => this.#hydrate(row));
		}

		// MySQL has no RETURNING, so the rows have to be read back -- and what to read them back by
		// depends on who generated the keys.
		const suppliedKeyIndex = columns.findIndex(
			(column) => column.name === this.mapping.primaryKey.name
		);

		const ids =
			suppliedKeyIndex === -1
				? this.#generatedKeyRange(result.insertId, rows.length)
				: rows.map((row) => {
						const expr = row[suppliedKeyIndex];
						if (expr.kind !== 'param') {
							throw new Error(
								`Cannot read back '${this.mapping.name}' rows: the primary key was written as ` +
									`an expression rather than a value, so there is nothing to select by.`
							);
						}
						return expr.value;
					});

		const found = await this.find({
			[`${this.mapping.primaryKey.property}_in`]: ids,
		} as Filter<G & H>);

		// Back into the order they were inserted in. `find` orders by primary key, which happens to
		// match for a generated range and does not for keys the client chose -- and core pairs
		// these with its inputs positionally to wire up foreign keys, so the wrong order attaches
		// children to the wrong parents.
		const byKey = new Map(
			found.map((entity) => [
				String((entity as Record<string, unknown>)[this.mapping.primaryKey.property]),
				entity,
			])
		);

		return ids.map((id) => byKey.get(String(id))).filter((entity) => entity !== undefined);
	}

	/**
	 * The keys MySQL allocated for an insert it generated them for.
	 *
	 * It reports only the first, but a simple insert allocates the range contiguously, so the rest
	 * follow. That guarantee holds under `innodb_autoinc_lock_mode` 1 and 2 for a statement whose
	 * row count is known up front, which is every insert we build.
	 */
	#generatedKeyRange(insertId: unknown, count: number) {
		if (insertId === undefined || insertId === null) {
			throw new Error('MySQL returned no insertId, so the generated keys cannot be recovered.');
		}

		return Array.from({ length: count }, (_, index) => Number(insertId) + index);
	}

	async updateOne(id: string | number, input: Partial<G & H>): Promise<G & H> {
		const [updated] = await this.#update([{ id, input }]);
		return updated;
	}

	async updateMany(inputs: Partial<G & H>[]): Promise<(G & H)[]> {
		const primaryKey = this.mapping.primaryKey.property as keyof (G & H);

		return this.#update(
			inputs.map((input) => {
				const id = input[primaryKey];

				if (id === undefined || id === null) {
					throw new Error('You must pass an ID for this entity to update it.');
				}

				return { id: id as string | number, input };
			})
		);
	}

	async #update(items: { id: string | number; input: Partial<G & H> }[]): Promise<(G & H)[]> {
		if (items.length === 0) return [];

		return this.withTransaction(async () => {
			const { dialect } = this.connection;

			for (const { id, input } of items) {
				const assignments = this.#assignments(input).filter(
					(assignment) => assignment.column.property !== this.mapping.primaryKey.property
				);

				if (assignments.length === 0) continue;

				const node = {
					kind: 'update' as const,
					table: { schema: this.mapping.schema, name: this.mapping.table, alias: ROOT_ALIAS },
					set: assignments.map(({ column, value }) => ({ column: column.name, value })),
					where: keyEquals(this.mapping.primaryKey, id),
				};

				const { rowCount } = await this.connection.query(compile(node, dialect));

				if (rowCount === 0) {
					throw new Error(`Unable to locate ${this.mapping.name} with ID '${id}' for updating.`);
				}
			}

			for (const { id, input } of items) {
				await this.#linkRelationships(id, input);
			}

			// One SELECT rather than RETURNING: MySQL has no RETURNING and SQL Server's OUTPUT
			// breaks on tables with triggers, so this keeps all four dialects on one code path.
			const ids = items.map((item) => item.id);
			return this.find({ [`${this.mapping.primaryKey.property}_in`]: ids } as Filter<G & H>);
		});
	}

	async createOrUpdateMany(inputs: Partial<G & H>[]): Promise<(G & H)[]> {
		const primaryKey = this.mapping.primaryKey.property as keyof (G & H);
		const withId = inputs.filter((input) => input[primaryKey] !== undefined);
		const withoutId = inputs.filter((input) => input[primaryKey] === undefined);

		return this.withTransaction(async () => {
			if (withId.length === 0) return this.createMany(withoutId);

			const existing = await this.find({
				[`${this.mapping.primaryKey.property}_in`]: withId.map((input) => input[primaryKey]),
			} as Filter<G & H>);

			const known = new Set(existing.map((row) => String(row[primaryKey])));
			const updates = withId.filter((input) => known.has(String(input[primaryKey])));
			const inserts = [
				...withoutId,
				...withId.filter((input) => !known.has(String(input[primaryKey]))),
			];

			return [
				...(await this.#update(
					updates.map((input) => ({ id: input[primaryKey] as string | number, input }))
				)),
				...(await this.createMany(inserts)),
			];
		});
	}

	async deleteOne(filter: Filter<G & H>): Promise<boolean> {
		// Resolve to keys first. The MikroORM provider issues the delete and then throws if it
		// removed more than one row, by which point the rows are already gone.
		const matches = await this.find(filter, { limit: 2 } as PaginationOptions);

		if (matches.length === 0) return false;
		if (matches.length > 1) {
			throw new Error(
				`Filter matched more than one ${this.mapping.name}, so it is not safe to delete.`
			);
		}

		await this.#deleteByKeys([matches[0][this.mapping.primaryKey.property as keyof (G & H)]]);
		return true;
	}

	async deleteMany(filter: Filter<G & H>): Promise<boolean> {
		return this.withTransaction(async () => {
			const matches = await this.find(filter);
			if (matches.length === 0) return true;

			const keys = matches.map((match) => match[this.mapping.primaryKey.property as keyof (G & H)]);
			const deleted = await this.#deleteByKeys(keys);

			if (deleted !== keys.length) {
				throw new Error(
					`Expected to delete ${keys.length} ${this.mapping.name} rows but deleted ${deleted}, rolling back.`
				);
			}

			return true;
		});
	}

	/**
	 * Applies to-many relationship payloads after the row itself is written.
	 *
	 * Core's batched writes decompose *nested creates* for us, but leave primary-key-only linking
	 * payloads on the node, so the provider still has to reconcile pivots and re-parent children.
	 * Semantics match the MikroORM provider: the given list replaces the whole collection, so
	 * anything previously linked and not listed is unlinked.
	 */
	async #linkRelationships(id: unknown, input: Partial<G & H>) {
		for (const [property, raw] of Object.entries(input)) {
			const relationship = this.mapping.relationships.get(property);

			// A many-to-one is a column on this row, so it was already written with the rest.
			if (!relationship || relationship.kind === 'manyToOne') continue;
			if (raw === undefined) continue;

			const target = relationship.target();
			const items = raw === null ? [] : Array.isArray(raw) ? raw : [raw];

			const relatedIds = items.map((item) => {
				const key = (item as Record<string, unknown> | null)?.[target.primaryKey.property];

				if (key === undefined || key === null) {
					throw new Error(
						`Cannot link '${this.mapping.name}.${property}': one of the given ` +
							`${target.name} records has no '${target.primaryKey.property}'.`
					);
				}

				return key;
			});

			if (relationship.kind === 'manyToMany') {
				await this.#reconcilePivot(relationship, id, relatedIds);
			} else {
				await this.#reparent(relationship, id, relatedIds);
			}
		}
	}

	/** Brings the pivot rows for one record in line with the list it was given. */
	async #reconcilePivot(
		relationship: ResolvedManyToMany,
		id: unknown,
		relatedIds: unknown[]
	): Promise<void> {
		const { dialect } = this.connection;
		const target = relationship.target();
		const { pivot } = relationship;
		const pivotTable = { schema: pivot.schema, name: pivot.table, alias: 'p0' };
		const ownerType = this.mapping.primaryKey.type;
		const relatedType = target.primaryKey.type;

		// Read what is linked now, so we only touch the difference. Blindly deleting and
		// reinserting would churn the table and break any row the pivot itself carries.
		const { rows } = await this.connection.query(
			compile(
				{
					kind: 'select',
					columns: [
						{
							expr: {
								kind: 'column',
								table: 'p0',
								column: pivot.inverseJoinColumn,
								type: relatedType,
							},
						},
					],
					from: pivotTable,
					joins: [],
					where: {
						kind: 'compare',
						op: '=',
						left: { kind: 'column', table: 'p0', column: pivot.joinColumn, type: ownerType },
						right: param(id, ownerType),
					},
					orderBy: [],
				},
				dialect
			)
		);

		const existing = new Set(rows.map((row) => String(row[pivot.inverseJoinColumn])));
		const wanted = new Set(relatedIds.map(String));

		const toRemove = [...existing].filter((key) => !wanted.has(key));
		const toAdd = relatedIds.filter((key) => !existing.has(String(key)));

		// One parameter for the owner id, one per key removed.
		for (const chunk of chunkForParameters(toRemove, dialect.maxBindParameters, 1, 1)) {
			await this.connection.query(
				compile(
					{
						kind: 'delete',
						from: pivotTable,
						where: and([
							{
								kind: 'compare',
								op: '=',
								left: bareColumn(pivot.joinColumn, ownerType),
								right: param(id, ownerType),
							},
							{
								kind: 'in',
								operand: bareColumn(pivot.inverseJoinColumn, relatedType),
								values: chunk.map((key) => param(key, relatedType)),
								negated: false,
							},
						]),
					},
					dialect
				)
			);
		}

		// Two per row: the owner id is repeated in every VALUES tuple.
		for (const chunk of chunkForParameters(toAdd, dialect.maxBindParameters, 2)) {
			await this.connection.query(
				compile(
					{
						kind: 'insert',
						into: pivotTable,
						columns: [pivot.joinColumn, pivot.inverseJoinColumn],
						rows: chunk.map((key) => [param(id, ownerType), param(key, relatedType)]),
					},
					dialect
				)
			);
		}
	}

	/**
	 * Points the listed children at this row and unlinks any that used to point here.
	 *
	 * Unlinking sets the foreign key to null. Where that column is NOT NULL the database will
	 * refuse, which is the same thing the MikroORM provider does -- it nulls the key and lets the
	 * constraint have the final word rather than deciding on the user's behalf.
	 */
	async #reparent(
		relationship: ResolvedOneToMany,
		id: unknown,
		relatedIds: unknown[]
	): Promise<void> {
		const { dialect } = this.connection;
		const target = relationship.target();
		const foreignKey = relationship.targetForeignKey();
		const table = { schema: target.schema, name: target.table, alias: ROOT_ALIAS };
		const ownerType = this.mapping.primaryKey.type;

		// Read who points here now, so the orphans can be named rather than described with a NOT
		// IN. A NOT IN cannot be split across statements -- each chunk would orphan the rows the
		// other chunks were keeping -- and on SQL Server a list this long does not fit in one.
		const { rows } = await this.connection.query(
			compile(
				{
					kind: 'select',
					columns: [
						{
							expr: {
								kind: 'column',
								table: ROOT_ALIAS,
								column: target.primaryKey.name,
								type: target.primaryKey.type,
							},
						},
					],
					from: table,
					joins: [],
					where: {
						kind: 'compare',
						op: '=',
						left: {
							kind: 'column',
							table: ROOT_ALIAS,
							column: foreignKey.name,
							type: foreignKey.type,
						},
						right: param(id, ownerType),
					},
					orderBy: [],
				},
				dialect
			)
		);

		const wanted = new Set(relatedIds.map(String));
		const toOrphan = rows
			.map((row) => row[target.primaryKey.name])
			.filter((key) => !wanted.has(String(key)));

		// One parameter for the null being written, one per key.
		for (const chunk of chunkForParameters(toOrphan, dialect.maxBindParameters, 1, 1)) {
			await this.connection.query(
				compile(
					{
						kind: 'update',
						table,
						set: [{ column: foreignKey.name, value: param(null, foreignKey.type) }],
						where: keyIn(target.primaryKey, chunk),
					},
					dialect
				)
			);
		}

		for (const chunk of chunkForParameters(relatedIds, dialect.maxBindParameters, 1, 1)) {
			await this.connection.query(
				compile(
					{
						kind: 'update',
						table,
						set: [{ column: foreignKey.name, value: param(id, foreignKey.type) }],
						where: keyIn(target.primaryKey, chunk),
					},
					dialect
				)
			);
		}
	}

	async #deleteByKeys(keys: unknown[]): Promise<number> {
		const node = {
			kind: 'delete' as const,
			from: { schema: this.mapping.schema, name: this.mapping.table, alias: ROOT_ALIAS },
			where: keyIn(this.mapping.primaryKey, keys),
		};

		const { rowCount } = await this.connection.query(compile(node, this.connection.dialect));
		logger.trace(`Deleted ${rowCount} ${this.mapping.name} row(s).`);

		return rowCount;
	}
}

/**
 * Splits a list so that each statement built from one chunk stays under the bind parameter ceiling.
 *
 * SQL Server takes at most 2100 parameters per request and rejects the whole statement over that,
 * so linking a playlist to its three thousand tracks has to become several statements rather than
 * one. `perItem` is how many parameters each element contributes, `fixed` the ones outside the
 * list.
 *
 * Chunking is only ever valid where the statements compose -- several INSERTs, or several DELETEs
 * over disjoint key sets. A `NOT IN` does not compose, which is why the callers below read the
 * current state and delete by key instead of writing one enormous negative predicate.
 */
const chunkForParameters = <T>(
	items: readonly T[],
	ceiling: number,
	perItem: number,
	fixed = 0
): T[][] => {
	const size = Math.max(1, Math.floor((ceiling - fixed) / perItem));
	if (items.length <= size) return items.length ? [[...items]] : [];

	const chunks: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size));
	}

	return chunks;
};

/** `column = value`, for a write predicate where columns compile unqualified. */
const keyEquals = (column: ResolvedColumn, value: unknown): Predicate => ({
	kind: 'compare',
	op: '=',
	left: { kind: 'column', table: '', column: column.name, type: column.type },
	right: param(value, column.type),
});

const keyIn = (column: ResolvedColumn, values: readonly unknown[]): Predicate => ({
	kind: 'in',
	operand: { kind: 'column', table: '', column: column.name, type: column.type },
	values: values.map((value) => param(value, column.type)),
	negated: false,
});

const bareColumn = (name: string, type: ColumnType): Expr => ({
	kind: 'column',
	table: '',
	column: name,
	type,
});

/** Groups write payloads by their column shape, since a VALUES list cannot mix column sets. */
const groupByShape = <T>(
	inputs: T[],
	assignmentsFor: (input: T) => { column: ResolvedColumn; value: Expr }[]
) => {
	const groups = new Map<
		string,
		{ columns: ResolvedColumn[]; rows: Expr[][]; indices: number[] }
	>();

	for (const [index, input] of inputs.entries()) {
		const assignments = assignmentsFor(input);
		const columns = assignments.map(({ column }) => column);
		const key = JSON.stringify(columns.map((column) => column.name));

		const group = groups.get(key) ?? { columns, rows: [], indices: [] };
		group.rows.push(assignments.map(({ value }) => value));
		group.indices.push(index);
		groups.set(key, group);
	}

	return [...groups.values()];
};
