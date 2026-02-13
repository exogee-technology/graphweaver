import {
	AggregationType,
	BackendProvider,
	graphweaverMetadata,
	GraphweaverPluginNextFunction,
	GraphweaverRequestEvent,
	Sort,
	trace as startTrace,
	TraceMethod,
	traceSync,
} from '@exogee/graphweaver';
import type {
	AggregationResult,
	BackendProviderConfig,
	EntityMetadata,
	FieldMetadata,
	Filter,
	PaginationOptions,
	TraceOptions,
} from '@exogee/graphweaver';
import { logger, safeErrorLog } from '@exogee/logger';
import {
	AutoPath,
	LoadStrategy,
	PopulateHint,
	Reference,
	RequestContext,
	sql,
} from '@mikro-orm/core';
import { pluginManager, apolloPluginManager } from '@exogee/graphweaver-server';

import {
	LockMode,
	QueryFlag,
	ReferenceKind,
	ConnectionManager,
	externalIdFieldMap,
	AnyEntity,
	IsolationLevel,
	ConnectionOptions,
	connectToDatabase,
	DatabaseType,
} from '..';

import { OptimisticLockError, sanitiseFilterForLogging } from '../utils';
import { assign } from './assign';

type PostgresError = {
	code: string;
	routine: string;
};

const objectOperations = new Set(['_and', '_or', '_not']);
const mikroObjectOperations = new Set(['$and', '$or', '$not']);
const nullBooleanOperations = new Set(['null', 'notnull']);

const appendPath = (path: string, newPath: string) =>
	path.length ? `${path}.${newPath}` : newPath;

export const gqlToMikro = (filter: any, databaseType?: DatabaseType): any => {
	if (Array.isArray(filter)) {
		return filter.map((element) => gqlToMikro(element, databaseType));
	} else if (typeof filter === 'object' && filter !== null) {
		for (const key of Object.keys(filter)) {
			// A null here is a user-specified value and is valid to filter on
			if (filter[key] === null) continue;

			if (objectOperations.has(key)) {
				// { _not: '1' } => { $not: '1' }
				filter[key.replace('_', '$')] = gqlToMikro(filter[key], databaseType);
				delete filter[key];
			} else if (typeof filter[key] === 'object' && !Array.isArray(filter[key])) {
				// Recurse over nested filters only (arrays are an argument to a filter, not a nested filter)
				filter[key] = gqlToMikro(filter[key], databaseType);
			} else if (key.indexOf('_') >= 0) {
				const [newKey, operator] = key.split('_');
				let newValue;
				if (nullBooleanOperations.has(operator) && typeof filter[key] === 'boolean') {
					// { firstName_null: true } => { firstName: { $eq: null } } or { firstName_null: false } => { firstName: { $ne: null } }
					// { firstName_notnull: true } => { firstName: { $ne: null } } or { firstName_notnull: false } => { firstName: { $eq: null } }
					newValue =
						(filter[key] && operator === 'null') || (!filter[key] && operator === 'notnull')
							? { $eq: null }
							: { $ne: null };
				} else if (operator === 'ilike' && databaseType !== 'postgresql') {
					logger.warn(
						`The $ilike operator is not supported by ${databaseType} databases. Operator coerced to $like.`
					);
					newValue = { $like: filter[key] };
				} else {
					// { firstName_in: ['k', 'b'] } => { firstName: { $in: ['k', 'b'] } }
					newValue = { [`$${operator}`]: gqlToMikro(filter[key], databaseType) };
					// They can construct multiple filters for the same key. In that case we need
					// to append them all into an object.
				}

				if (typeof filter[newKey] !== 'undefined') {
					if (typeof filter[newKey] !== 'object') {
						if (typeof newValue === 'object' && '$eq' in newValue) {
							throw new Error(
								`property ${newKey} on filter is ambiguous. There are two values for this property: ${filter[newKey]} and ${newValue.$eq}`
							);
						}
						filter[newKey] = { ...{ $eq: filter[newKey] }, ...newValue };
					} else {
						if (newValue && typeof newValue === 'object' && '$eq' in newValue) {
							throw new Error(
								`property ${newKey} on filter is ambiguous. There are two values for this property: ${JSON.stringify(
									filter[newKey]
								)} and ${JSON.stringify(newValue)}`
							);
						}
						filter[newKey] = { ...filter[newKey], ...newValue };
					}
				} else {
					filter[newKey] = newValue;
				}

				delete filter[key];
			}
		}
	}
	return filter;
};

export interface AdditionalOptions {
	transactionIsolationLevel?: IsolationLevel;
	backendDisplayName?: string;
}

export class MikroBackendProvider<D> implements BackendProvider<D> {
	private _backendId: string;

	private connection: ConnectionOptions;

	public entityType: new () => D;
	public connectionManagerId?: string;
	private transactionIsolationLevel!: IsolationLevel;

	// This is an optional setting that allows you to control how this provider is displayed in the Admin UI.
	// If you do not set a value, it will default to 'REST (hostname of baseUrl)'. Entities are grouped by
	// their backend's display name, so if you want to group them in a more specific way, this is the way to do it.
	public readonly backendDisplayName?: string;

	public readonly supportsInFilter = true;

	// Default backend provider config
	public readonly backendProviderConfig: BackendProviderConfig = {
		filter: true,
		pagination: false,
		orderBy: false,
		supportedAggregationTypes: new Set<AggregationType>([AggregationType.COUNT]),
		supportsPseudoCursorPagination: true,
	};

	get backendId() {
		return this._backendId;
	}

	private get database() {
		// If we have a connection manager ID then use that else fallback to the Database
		if (!this.connectionManagerId) return ConnectionManager.default;
		return ConnectionManager.database(this.connectionManagerId) || ConnectionManager.default;
	}

	// This is exposed for use in the RLS package
	public get transactional() {
		return this.database.transactional;
	}

	public async withTransaction<T>(callback: () => Promise<T>) {
		return this.database.transactional<T>(callback, this.transactionIsolationLevel);
	}

	// This is exposed for use in the RLS package
	public get em() {
		return this.database.em;
	}

	public constructor(
		mikroType: new () => D,
		connection: ConnectionOptions,
		transactionIsolationLevel?: IsolationLevel
	);
	public constructor(
		mikroType: new () => D,
		connection: ConnectionOptions,
		additionalOptions?: AdditionalOptions
	);
	public constructor(
		mikroType: new () => D,
		connection: ConnectionOptions,
		optionsOrIsolationLevel: AdditionalOptions | IsolationLevel = {
			transactionIsolationLevel: IsolationLevel.REPEATABLE_READ,
		}
	) {
		const options =
			typeof optionsOrIsolationLevel === 'object'
				? optionsOrIsolationLevel
				: {
						transactionIsolationLevel: optionsOrIsolationLevel,
					};

		this.entityType = mikroType;
		this.connectionManagerId = connection.connectionManagerId;
		this._backendId = `mikro-orm-${connection.connectionManagerId || ''}`;
		this.transactionIsolationLevel =
			options.transactionIsolationLevel ?? IsolationLevel.REPEATABLE_READ;
		this.backendDisplayName = options.backendDisplayName;
		this.connection = connection;
		this.addRequestContext();
		this.connectToDatabase();
	}
	private getDbType(): DatabaseType {
		const driver = this.em.getDriver().constructor.name;
		// This used to import the actual drivers, but since they're optional it makes more sense
		// to just use the strings. Using startsWith to handle ESBuild minification that may rename classes.
		if (driver.startsWith('MsSqlDriver')) return 'mssql';
		if (driver.startsWith('MySqlDriver')) return 'mysql';
		if (driver.startsWith('PostgreSqlDriver')) return 'postgresql';
		if (driver.startsWith('SqliteDriver')) return 'sqlite';

		throw new Error(`This driver (${driver}) is not supported!`);
	}

	private connectToDatabase = async () => {
		const connectionManagerId = this.connectionManagerId;
		if (!connectionManagerId) {
			throw new Error('Expected connectionManagerId to be defined when calling addRequestContext.');
		}

		apolloPluginManager.addPlugin(connectionManagerId, connectToDatabase(this.connection));
	};

	private addRequestContext = () => {
		const connectionManagerId = this.connectionManagerId;
		if (!connectionManagerId) {
			throw new Error('Expected connectionManagerId to be defined when calling addRequestContext.');
		}

		const connectionPlugin = {
			name: connectionManagerId,
			event: GraphweaverRequestEvent.OnRequest,
			next: async (_: GraphweaverRequestEvent, _next: GraphweaverPluginNextFunction) => {
				logger.trace(`Graphweaver OnRequest plugin called`);

				const connection = await ConnectionManager.awaitableDatabase(connectionManagerId);

				if (!connection) {
					throw new Error(
						`No database connection found for connectionManagerId: ${connectionManagerId} after waiting for connection. This should not happen.`
					);
				}

				return RequestContext.create(connection.orm.em, _next, {});
			},
		};
		pluginManager.addPlugin(connectionPlugin);
	};

	private mapAndAssignKeys = (result: D, entityType: new () => D, inputArgs: Partial<D>) => {
		// Clean the input and remove any GraphQL classes from the object
		const assignmentObj = this.applyExternalIdFields(entityType, inputArgs);
		return assign(result, assignmentObj, undefined, undefined, this.database.em);
	};

	private applyExternalIdFields = (target: AnyEntity | string, values: any) => {
		const targetName = typeof target === 'string' ? target : target.name;
		const map = externalIdFieldMap.get(targetName);

		const mapFieldNames = (partialFilterObj: any) => {
			for (const [from, to] of Object.entries(map || {})) {
				if (partialFilterObj[from]) {
					const keys = Object.keys(partialFilterObj[from]);
					if (keys.length > 1) {
						throw new Error(
							`Expected precisely 1 key in queryObj.${from} on ${target}, got ${JSON.stringify(
								partialFilterObj[from],
								null,
								4
							)}`
						);
					}

					partialFilterObj[to] = partialFilterObj[from][keys[0]];
					delete partialFilterObj[from];
				}
			}
		};

		// Check for and/or/etc at the root level and handle correctly
		for (const rootLevelKey of Object.keys(values)) {
			if (mikroObjectOperations.has(rootLevelKey)) {
				if (Array.isArray(values[rootLevelKey])) {
					for (const field of values[rootLevelKey]) {
						mapFieldNames(field);
					}
				} else {
					mapFieldNames(values[rootLevelKey]);
				}
			}
		}
		// Map the rest of the field names as well
		mapFieldNames(values);

		// Traverse the nested entities
		const { properties } = this.database.em.getMetadata().get(targetName);
		Object.values(properties)
			.filter((property) => typeof property.entity !== 'undefined' && values[property.name])
			.forEach((property) => {
				if (Array.isArray(values[property.name])) {
					values[property.name].forEach((value: any) =>
						this.applyExternalIdFields(property.type, value)
					);
				} else {
					values[property.name] = this.applyExternalIdFields(property.type, values[property.name]);
				}
			});

		return values;
	};

	// Check if we have any keys that are a collection of entities
	public visitPathForPopulate = (entityName: string, updateArgBranch: any, populateBranch = '') => {
		const { properties } = this.database.em.getMetadata().get(entityName);
		const collectedPaths = populateBranch ? new Set<string>([populateBranch]) : new Set<string>([]);

		for (const [key, value] of Object.entries(updateArgBranch ?? {})) {
			if (
				// If it's a relationship, go ahead and and '.' it in, recurse.
				properties[key]?.kind === ReferenceKind.ONE_TO_ONE ||
				properties[key]?.kind === ReferenceKind.ONE_TO_MANY ||
				properties[key]?.kind === ReferenceKind.MANY_TO_ONE ||
				properties[key]?.kind === ReferenceKind.MANY_TO_MANY
			) {
				if (Array.isArray(value)) {
					// In the case where the array is empty we also need to make sure we load the collection.
					collectedPaths.add(appendPath(populateBranch, key));

					for (const entry of value) {
						// Recurse
						const newPaths = this.visitPathForPopulate(
							properties[key].type,
							entry,
							appendPath(populateBranch, key)
						);
						newPaths.forEach((path) => collectedPaths.add(path));
					}
				} else if (typeof value === 'object') {
					// Recurse
					const newPaths = this.visitPathForPopulate(
						properties[key].type,
						value,
						appendPath(populateBranch, key)
					);
					newPaths.forEach((path) => collectedPaths.add(path));
				}
			}
		}

		return collectedPaths;
	};

	// Some connections (ex. sqlite) require an explicit flush during batch inserts 
	// to retrieve user defined primary keys correctly.
	private flushOnBatchInserts() {
		const driver = this.em.getDriver();
		return driver.constructor.name === 'SqliteDriver';
	};

	@TraceMethod()
	public async find(
		filter: Filter<D>,
		pagination?: PaginationOptions,
		entityMetadata?: EntityMetadata,
		trace?: TraceOptions
	): Promise<D[]> {
		// If we have a span, update the name
		trace?.span.updateName(`Mikro-Orm - Find ${this.entityType.name}`);

		logger.trace(
			{ filter: sanitiseFilterForLogging(filter), entity: this.entityType.name },
			'Running find with filter'
		);

		// Strip custom types out of the equation.
		// This query only works if we JSON.parse(JSON.stringify(filter)):
		const where = traceSync((trace?: TraceOptions) => {
			trace?.span.updateName('Convert filter to Mikro-Orm format');
			return filter ? gqlToMikro(JSON.parse(JSON.stringify(filter)), this.getDbType()) : undefined;
		})();

		// Convert from: { account: {id: '6' }}
		// to { accountId: '6' }
		// This conversion only works on root level objects
		const whereWithAppliedExternalIdFields = where
			? this.applyExternalIdFields(this.entityType, where)
			: {};

		// Regions need some fancy handling with Query Builder. Process the where further
		// and return a Query Builder instance.
		const query = this.em.createQueryBuilder(this.entityType);
		if (Object.keys(whereWithAppliedExternalIdFields).length > 0) {
			query.andWhere(whereWithAppliedExternalIdFields);
		}

		// If we have specified a limit, offset or order then update the query
		if (pagination?.limit) query.limit(pagination.limit);
		if (pagination?.offset) query.offset(pagination.offset);
		if (pagination?.orderBy) query.orderBy({ ...pagination.orderBy });

		// Certain query filters can result in duplicate records once all joins are resolved
		// These duplicates can be discarded as related entities are returned to the
		// API consumer via field resolvers
		query.setFlag(QueryFlag.DISTINCT);

		// 1:1 relations that aren't on the owning side need to get populated so the references get set.
		// This method is protected, but we need to use it from here, hence the `as any`.
		const driver = this.database.em.getDriver();
		const meta = this.database.em.getMetadata().get(this.entityType.name);
		query.populate((driver as any).autoJoinOneToOneOwner(meta, []));

		try {
			const result = await startTrace(async (trace?: TraceOptions) => {
				trace?.span.updateName('Mikro-Orm - Fetch Data');
				return query.getResult();
			})();

			logger.trace(`find ${this.entityType.name} result: ${result.length} rows`);

			return result;
		} catch (err) {
			safeErrorLog(logger, err, `find ${this.entityType.name} error`);

			if ((err as PostgresError)?.routine === 'InitializeSessionUserId') {
				// Throw if the user credentials are incorrect
				throw new Error(
					'Database connection failed, please check you are using the correct user credentials for the database.'
				);
			} else if ((err as PostgresError)?.code === 'ECONNREFUSED') {
				// Throw if the database address or port is incorrect
				throw new Error(
					'Database connection failed, please check you are using the correct address and port for the database.'
				);
			} else {
				throw err;
			}
		}
	}

	@TraceMethod()
	public async findOne(
		filter: Filter<D>,
		entityMetadata?: EntityMetadata,
		trace?: TraceOptions
	): Promise<D | null> {
		trace?.span.updateName(`Mikro-Orm - FindOne ${this.entityType.name}`);
		logger.trace(
			{ entity: this.entityType.name, filter: sanitiseFilterForLogging(filter) },
			'Running findOne with filter'
		);

		const metadata = this.em.getMetadata().get(this.entityType.name);
		let primaryKeyField = metadata.primaryKeys[0];

		if (!primaryKeyField && entityMetadata) {
			// When using virtual entities, MikroORM will have no primary keys.
			// In this scenario we actually know what the primary key is from
			// the GraphQL metadata, so we can go ahead and use it.
			primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entityMetadata);
		}

		if (!primaryKeyField || metadata.primaryKeys.length > 1) {
			throw new Error(
				`Entity ${this.entityType.name} has ${metadata.primaryKeys.length} primary keys. We only support entities with a single primary key at this stage.`
			);
		}

		const [result] = await this.find(filter, {
			orderBy: { [primaryKeyField]: Sort.DESC },
			offset: 0,
			limit: 1,
		});

		logger.trace({ result, entity: this.entityType.name }, 'findOne result');

		return result;
	}

	@TraceMethod()
	public async findByRelatedId(
		entity: any,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: any,
		trace?: TraceOptions
	): Promise<D[]> {
		trace?.span.updateName(`Mikro-Orm - findByRelatedId ${this.entityType.name}`);
		logger.trace(
			{
				entity: this.entityType.name,
				relatedField,
				relatedFieldIds,
				filter: sanitiseFilterForLogging(filter),
			},
			'Running findByRelatedId'
		);

		// Any is the actual type from MikroORM, sorry folks.
		let queryFilter: any = { [relatedField]: { $in: relatedFieldIds } };

		if (filter) {
			// JSON.parse(JSON.stringify()) is needed. See https://exogee.atlassian.net/browse/EXOGW-419
			const gqlToMikroFilter = JSON.parse(JSON.stringify([gqlToMikro(filter, this.getDbType())]));
			// Since the user has supplied a filter, we need to and it in.
			queryFilter = { $and: [queryFilter, ...gqlToMikroFilter] };
		}

		const populate = [relatedField as AutoPath<typeof entity, PopulateHint>];
		const result = await this.database.em.find(entity, queryFilter, {
			// We only need one result per entity.
			flags: [QueryFlag.DISTINCT],

			// We do want to populate the relation, however, see below.
			populate,

			// We'd love to use the default joined loading strategy, but it doesn't work with the populateWhere option.
			strategy: LoadStrategy.SELECT_IN,

			// This tells MikroORM we only need to load the related entities if they match the filter specified above.
			populateWhere: PopulateHint.INFER,
		});

		return result as D[];
	}

	@TraceMethod()
	public async updateOne(
		id: string | number,
		updateArgs: Partial<D & { version?: number }>,
		trace?: TraceOptions
	): Promise<D> {
		trace?.span.updateName(`Mikro-Orm - updateOne ${this.entityType.name}`);

		logger.trace(
			{
				id,
				updateArgs: sanitiseFilterForLogging(updateArgs),
				entity: this.entityType.name,
			},
			'Running update with args'
		);

		const entity = await this.database.em.findOne(this.entityType, id, {
			// This is an optimisation so that assign() doesn't have to go fetch everything one at a time.
			populate: [...this.visitPathForPopulate(this.entityType.name, updateArgs)] as `${string}.`[],
		});

		if (entity === null) {
			throw new Error(`Unable to locate ${this.entityType.name} with ID: '${id}' for updating.`);
		}

		const { version, ...updateArgsWithoutVersion } = updateArgs;

		// If a version has been sent, let's check it
		if (version) {
			try {
				await this.database.em.lock(entity, LockMode.OPTIMISTIC, version);
			} catch (err) {
				throw new OptimisticLockError((err as Error)?.message, { entity });
			}
		}

		// For an update we also want to go ahead and remove the primary key if it's autoincremented, as
		// users should not be able to change the primary key. There are also scenarios like
		// GENERATED ALWAYS AS IDENTITY where even supplying the primary key in the update query will
		// cause an error.
		const meta = this.database.em.getMetadata().get(this.entityType.name);
		for (const key of meta.primaryKeys) {
			if (meta.properties[key].autoincrement) delete (updateArgsWithoutVersion as any)[key];
		}

		await this.mapAndAssignKeys(entity, this.entityType, updateArgsWithoutVersion as Partial<D>);
		await this.database.em.persistAndFlush(entity);

		logger.trace(`update ${this.entityType.name} entity`, entity);

		return entity;
	}

	@TraceMethod()
	public async updateMany(
		updateItems: Partial<D>[],
		trace?: TraceOptions
	): Promise<D[]> {
		trace?.span.updateName(`Mikro-Orm - updateMany ${this.entityType.name}`);
		logger.trace(
			{ updateItems: sanitiseFilterForLogging(updateItems), entity: this.entityType.name },
			'Running update many with args'
		);

		const meta = this.database.em.getMetadata().get(this.entityType.name);
		const primaryKeyField = meta.primaryKeys[0];

		const entities = await this.database.transactional<D[]>(async () => {
			return Promise.all<D>(
				updateItems.map(async (item) => {
					const { [primaryKeyField]: primaryKey } = item as any;
					if (!primaryKey) throw new Error('You must pass an ID for this entity to update it.');

					// Find the entity in the database
					const entity = await this.database.em.findOneOrFail(this.entityType, { [primaryKeyField]: primaryKey } as any, {
						populate: [...this.visitPathForPopulate(this.entityType.name, item)] as `${string}.`[],
					});

					// For an update we also want to go ahead and remove the primary key if it's autoincremented, as
					// users should not be able to change the primary key. There are also scenarios like
					// GENERATED ALWAYS AS IDENTITY where even supplying the primary key in the update query will
					// cause an error.
					for (const key of meta.primaryKeys) {
						if (meta.properties[key].autoincrement) delete (item as any)[key];
					}

					await this.mapAndAssignKeys(entity, this.entityType, item);
					this.database.em.persist(entity);
					return entity;
				})
			);
		});

		logger.trace({ entity: this.entityType.name, entities }, 'updated items');

		return entities;
	}

	@TraceMethod()
	public async createOrUpdateMany(items: Partial<D>[], trace?: TraceOptions): Promise<D[]> {
		trace?.span.updateName(`Mikro-Orm - createOrUpdateMany ${this.entityType.name}`);
		logger.trace(
			{ items: sanitiseFilterForLogging(items), entity: this.entityType.name },
			'Running create or update many with args'
		);

		const meta = this.database.em.getMetadata().get(this.entityType.name);
		const primaryKeyField = meta.primaryKeys[0];
		const gwMetadata = graphweaverMetadata.getEntityMetadataByDataEntity(this.entityType);
		const clientGeneratedPrimaryKeys = gwMetadata?.apiOptions?.clientGeneratedPrimaryKeys ?? false;

		const entities = await this.database.transactional<D[]>(async () => {
			return Promise.all<D>(
				items.map(async (item) => {
					let entity;
					const { [primaryKeyField]: primaryKey } = item as any;

					if (primaryKey) {
						entity = await this.database.em.findOne(this.entityType, { [primaryKeyField]: primaryKey }, {
							populate: [
								...this.visitPathForPopulate(this.entityType.name, item),
							] as `${string}.`[],
						});

						if (entity) {
							logger.trace({ item, entity: this.entityType.name }, 'Running update with item');
							await this.mapAndAssignKeys(entity, this.entityType, item);
						} else if (clientGeneratedPrimaryKeys) {
							entity = new this.entityType();
							await this.mapAndAssignKeys(entity, this.entityType, item);
							logger.trace({ item, entity: this.entityType.name }, 'Running create with client-generated key');
						} else {
							throw new Error(
								`Entity ${this.entityType.name} with primary key '${primaryKey}' not found and clientGeneratedPrimaryKeys is not enabled.`
							);
						}
					} else {
						entity = new this.entityType();
						await this.mapAndAssignKeys(entity, this.entityType, item);
						logger.trace({ item, entity: this.entityType.name }, 'Running create with item');
					}
					this.database.em.persist(entity);
					return entity;
				})
			);
		});

		logger.trace(
			{ entity: this.entityType.name, entities: sanitiseFilterForLogging(entities) },
			'created or updated items'
		);

		return entities;
	}

	@TraceMethod()
	public async createOne(createArgs: Partial<D>, trace?: TraceOptions): Promise<D> {
		trace?.span.updateName(`Mikro-Orm - createOne ${this.entityType.name}`);
		logger.trace(
			{ createArgs: sanitiseFilterForLogging(createArgs), entity: this.entityType.name },
			'Running create with args'
		);

		const entity = new this.entityType();
		await this.mapAndAssignKeys(entity, this.entityType, createArgs);
		await this.database.em.persistAndFlush(entity as Partial<D>);

		logger.trace(
			{ entity: this.entityType.name, result: sanitiseFilterForLogging(entity) },
			'create result'
		);

		return entity;
	}

	@TraceMethod()
	public async createMany(createItems: Partial<D>[], trace?: TraceOptions): Promise<D[]> {
		trace?.span.updateName(`Mikro-Orm - createMany ${this.entityType.name}`);
		return this._createMany(createItems);
	}

	public async createTraces(createItems: Partial<D>[]): Promise<D[]> {
		return this._createMany(createItems);
	}

	private async _createMany(createItems: Partial<D>[]) {
		logger.trace(
			{ createItems: sanitiseFilterForLogging(createItems), entity: this.entityType.name },
			'Running create with args'
		);

		const entities = await this.database.transactional<D[]>(async () => {
			const result: D[] = [];
			for (const item of createItems) {
				const entity = new this.entityType();
				await this.mapAndAssignKeys(entity, this.entityType, item);
				this.database.em.persist(entity as Partial<D>);
				result.push(entity);
			}

			if (this.flushOnBatchInserts()) {
				await this.database.em.flush();
			}

			return result;
		});

		logger.trace({ entity: this.entityType.name, entities }, 'created items');

		return entities;
	}

	@TraceMethod()
	public async deleteOne(filter: Filter<D>, trace?: TraceOptions): Promise<boolean> {
		trace?.span.updateName(`Mikro-Orm - deleteOne ${this.entityType.name}`);
		logger.trace(
			{ filter: sanitiseFilterForLogging(filter), entity: this.entityType.name },
			'Running delete with filter.'
		);
		const where = filter
			? gqlToMikro(JSON.parse(JSON.stringify(filter)), this.getDbType())
			: undefined;
		const whereWithAppliedExternalIdFields =
			where && this.applyExternalIdFields(this.entityType, where);

		const deletedRows = await this.database.em.nativeDelete(
			this.entityType,
			whereWithAppliedExternalIdFields
		);

		if (deletedRows > 1) {
			throw new Error('Multiple deleted rows');
		}

		logger.trace(`delete ${this.entityType.name} result: deleted ${deletedRows} row(s)`);

		return deletedRows === 1;
	}

	@TraceMethod()
	public async deleteMany(filter: Filter<D>, trace?: TraceOptions): Promise<boolean> {
		trace?.span.updateName(`Mikro-Orm - deleteMany ${this.entityType.name}`);
		logger.trace(
			{ filter: sanitiseFilterForLogging(filter), entity: this.entityType.name },
			'Running delete'
		);

		const deletedRows = await this.database.transactional<number>(async () => {
			const where = filter
				? gqlToMikro(JSON.parse(JSON.stringify(filter)), this.getDbType())
				: undefined;
			const whereWithAppliedExternalIdFields =
				where && this.applyExternalIdFields(this.entityType, where);

			const toDelete = await this.database.em.count(
				this.entityType,
				whereWithAppliedExternalIdFields
			);
			const deletedCount = await this.database.em.nativeDelete(
				this.entityType,
				whereWithAppliedExternalIdFields
			);

			if (deletedCount !== toDelete) {
				throw new Error('We did not delete any rows, rolling back.');
			}

			return deletedCount;
		});

		logger.trace(`delete ${this.entityType.name} result: deleted ${deletedRows} row(s)`);

		return true;
	}

	public foreignKeyForRelationshipField?(field: FieldMetadata, dataEntity: D) {
		const value = dataEntity[field.name as keyof D];

		if (Reference.isReference(value)) {
			const { properties } = this.database.em.getMetadata().get(this.entityType);
			const property = properties[field.name];
			const [primaryKey] = property.targetMeta?.primaryKeys ?? [];
			if (!primaryKey) {
				throw new Error(
					`Could not determine primary key for ${field.name} on ${this.entityType.name}`
				);
			}

			const foreignKey = (value.unwrap() as any)[primaryKey];
			if (foreignKey === undefined || foreignKey === null) {
				throw new Error(
					`Could not read foreign key from reference: ${value.unwrap()} with primary key name ${primaryKey}`
				);
			}

			return foreignKey;
		}

		return null;
	}

	@TraceMethod()
	public async aggregate(
		filter: Filter<D>,
		requestedAggregations: Set<AggregationType>,
		trace?: TraceOptions
	): Promise<AggregationResult> {
		trace?.span.updateName(`Mikro-Orm - aggregate ${this.entityType.name}`);
		logger.trace(
			{ filter: sanitiseFilterForLogging(filter), entity: this.entityType.name },
			'Running aggregate with filter'
		);

		// Strip custom types out of the equation.
		// This query only works if we JSON.parse(JSON.stringify(filter)):
		//
		// query {
		//   drivers (filter: { region: { name: "North Shore" }}) {
		//     id
		//   }
		// }
		const where = filter
			? gqlToMikro(JSON.parse(JSON.stringify(filter)), this.getDbType())
			: undefined;

		// Convert from: { account: {id: '6' }}
		// to { accountId: '6' }
		// This conversion only works on root level objects
		const whereWithAppliedExternalIdFields = where
			? this.applyExternalIdFields(this.entityType, where)
			: {};

		// Regions need some fancy handling with Query Builder. Process the where further
		// and return a Query Builder instance.
		const query = this.em.createQueryBuilder(this.entityType);

		if (Object.keys(whereWithAppliedExternalIdFields).length > 0) {
			query.andWhere(whereWithAppliedExternalIdFields);
		}

		const result: AggregationResult = {};

		try {
			if (requestedAggregations.has(AggregationType.COUNT)) {
				const meta = this.database.em.getMetadata().get(this.entityType.name);
				if (meta.primaryKeys.length) {
					// It's a standard entity with primary keys, we can do a full distinct
					// on these keys.
					result.count = await query.getCount(meta.primaryKeys, true);
				} else {
					// It's either a virtual entity, or it's an entity without primary keys.
					// We just need to count * as a fallback, no distinct.
					const [firstRow] = await query.select(sql`count(*)`.as('count')).execute();
					result.count = firstRow.count;
				}
			}
		} catch (err) {
			safeErrorLog(logger, err, `find ${this.entityType.name} error`);

			if ((err as PostgresError)?.routine === 'InitializeSessionUserId') {
				// Throw if the user credentials are incorrect
				throw new Error(
					'Database connection failed, please check you are using the correct user credentials for the database.'
				);
			} else if ((err as PostgresError)?.code === 'ECONNREFUSED') {
				// Throw if the database address or port is incorrect
				throw new Error(
					'Database connection failed, please check you are using the correct address and port for the database.'
				);
			} else {
				throw err;
			}
		}

		return result;
	}
}
