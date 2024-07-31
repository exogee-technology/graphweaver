import {
	BackendProvider,
	PaginationOptions,
	Sort,
	Filter,
	BackendProviderConfig,
	FieldMetadata,
	AggregationResult,
	AggregationType,
	TraceMethod,
	TraceOptions,
	traceSync,
	trace as startTrace,
	GraphweaverRequestEvent,
	GraphweaverPluginNextFunction,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { Reference, RequestContext } from '@mikro-orm/core';
import { AutoPath, PopulateHint } from '@mikro-orm/postgresql';
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
} from '..';

import { OptimisticLockError } from '../utils/errors';
import { assign } from './assign';

type PostgresError = {
	code: string;
	routine: string;
};

const objectOperations = new Set(['_and', '_or', '_not']);
const mikroObjectOperations = new Set(['$and', '$or', '$not']);

const appendPath = (path: string, newPath: string) =>
	path.length ? `${path}.${newPath}` : newPath;

export const gqlToMikro: (filter: any) => any = (filter: any) => {
	if (Array.isArray(filter)) {
		return filter.map((element) => gqlToMikro(element));
	} else if (typeof filter === 'object') {
		for (const key of Object.keys(filter)) {
			// A null here is a user-specified value and is valid to filter on
			if (filter[key] === null) continue;

			if (objectOperations.has(key)) {
				// { _not: '1' } => { $not: '1' }
				filter[key.replace('_', '$')] = gqlToMikro(filter[key]);
				delete filter[key];
			} else if (typeof filter[key] === 'object' && !Array.isArray(filter[key])) {
				// Recurse over nested filters only (arrays are an argument to a filter, not a nested filter)
				filter[key] = gqlToMikro(filter[key]);
			} else if (key.indexOf('_') >= 0) {
				// { firstName_in: ['k', 'b'] } => { firstName: { $in: ['k', 'b'] } }
				const [newKey, operator] = key.split('_');
				const newValue = { [`$${operator}`]: gqlToMikro(filter[key]) };

				// They can construct multiple filters for the same key. In that case we need
				// to append them all into an object.
				if (typeof filter[newKey] !== 'undefined') {
					filter[newKey] = { ...filter[newKey], ...newValue };
				} else {
					filter[newKey] = newValue;
				}

				delete filter[key];
			}
		}
	}
	return filter;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export class MikroBackendProvider<D> implements BackendProvider<D> {
	private _backendId: string;

	private connection: ConnectionOptions;

	public entityType: new () => D;
	public connectionManagerId?: string;
	private transactionIsolationLevel!: IsolationLevel;

	public readonly supportsInFilter = true;

	// Default backend provider config
	public readonly backendProviderConfig: BackendProviderConfig = {
		filter: true,
		pagination: false,
		orderBy: false,
		sort: false,
		supportedAggregationTypes: new Set<AggregationType>([AggregationType.COUNT]),
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
		transactionIsolationLevel: IsolationLevel = IsolationLevel.REPEATABLE_READ
	) {
		this.entityType = mikroType;
		this.connectionManagerId = connection.connectionManagerId;
		this._backendId = `mikro-orm-${connection.connectionManagerId || ''}`;
		this.transactionIsolationLevel = transactionIsolationLevel;
		this.connection = connection;
		this.addRequestContext();
		this.connectToDatabase();
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
			next: (_: GraphweaverRequestEvent, _next: GraphweaverPluginNextFunction) => {
				logger.trace(`Graphweaver OnRequest plugin called`);

				const connection = ConnectionManager.database(connectionManagerId);
				if (!connection) throw new Error('No database connection found');

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
				if (partialFilterObj[from] && typeof partialFilterObj[from].id !== 'undefined') {
					if (Object.keys(partialFilterObj[from]).length > 1) {
						throw new Error(
							`Expected precisely 1 key called 'id' in queryObj.${from} on ${target}, got ${JSON.stringify(
								partialFilterObj[from],
								null,
								4
							)}`
						);
					}

					partialFilterObj[to] = partialFilterObj[from].id;
					delete partialFilterObj[from];
				}
			}
		};

		// Check for and/or/etc at the root level and handle correctly
		for (const rootLevelKey of Object.keys(values)) {
			if (mikroObjectOperations.has(rootLevelKey)) {
				for (const field of values[rootLevelKey]) {
					mapFieldNames(field);
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

	@TraceMethod()
	public async find(
		filter: Filter<D>,
		pagination?: PaginationOptions,
		trace?: TraceOptions
	): Promise<D[]> {
		// If we have a span, update the name
		trace?.span.updateName(`Mikro-Orm - Find ${this.entityType.name}`);

		logger.trace(`Running find ${this.entityType.name} with filter`, {
			filter: JSON.stringify(filter),
		});

		// Strip custom types out of the equation.
		// This query only works if we JSON.parse(JSON.stringify(filter)):
		//
		// query {
		//   drivers (filter: { region: { name: "North Shore" }}) {
		//     id
		//   }
		// }
		const where = traceSync((trace?: TraceOptions) => {
			trace?.span.updateName('Convert filter to Mikro-Orm format');
			return filter ? gqlToMikro(JSON.parse(JSON.stringify(filter))) : undefined;
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
		pagination?.limit && query.limit(pagination.limit);
		pagination?.offset && query.offset(pagination.offset);
		pagination?.orderBy && query.orderBy({ ...pagination.orderBy });

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
			logger.error(`find ${this.entityType.name} error: ${JSON.stringify(err)}`);

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
	public async findOne(filter: Filter<D>, trace?: TraceOptions): Promise<D | null> {
		trace?.span.updateName(`Mikro-Orm - FindOne ${this.entityType.name}`);
		logger.trace(`Running findOne ${this.entityType.name} with filter ${filter}`);

		const metadata = this.em.getMetadata().get(this.entityType.name);
		if (metadata.primaryKeys.length !== 1) {
			throw new Error(
				`Entity ${this.entityType.name} has ${metadata.primaryKeys.length} primary keys. We only support entities with a single primary key at this stage.`
			);
		}

		const [result] = await this.find(filter, {
			orderBy: { [metadata.primaryKeys[0]]: Sort.DESC },
			offset: 0,
			limit: 1,
		});

		logger.trace(`findOne ${this.entityType.name} result`, { result });

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
		const queryFilter = {
			$and: [{ [relatedField]: { $in: relatedFieldIds } }, ...[gqlToMikro(filter) ?? []]],
		};

		const populate = [relatedField as AutoPath<typeof entity, PopulateHint>];
		const result = await this.database.em.find(entity, queryFilter, {
			populate,
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

		logger.trace(`Running update ${this.entityType.name} with args`, {
			id,
			updateArgs: JSON.stringify(updateArgs),
		});

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

		await this.mapAndAssignKeys(entity, this.entityType, updateArgsWithoutVersion as Partial<D>);
		await this.database.em.persistAndFlush(entity);

		logger.trace(`update ${this.entityType.name} entity`, entity);

		return entity;
	}

	@TraceMethod()
	public async updateMany(
		updateItems: (Partial<D> & { id: string })[],
		trace?: TraceOptions
	): Promise<D[]> {
		trace?.span.updateName(`Mikro-Orm - updateMany ${this.entityType.name}`);
		logger.trace(`Running update many ${this.entityType.name} with args`, {
			updateItems: JSON.stringify(updateItems),
		});

		const entities = await this.database.transactional<D[]>(async () => {
			return Promise.all<D>(
				updateItems.map(async (item) => {
					if (!item?.id) throw new Error('You must pass an ID for this entity to update it.');

					// Find the entity in the database
					const entity = await this.database.em.findOneOrFail(this.entityType, item.id, {
						populate: [...this.visitPathForPopulate(this.entityType.name, item)] as `${string}.`[],
					});
					await this.mapAndAssignKeys(entity, this.entityType, item);
					this.database.em.persist(entity);
					return entity;
				})
			);
		});

		logger.trace(`updated ${this.entityType.name} items `, entities);

		return entities;
	}

	@TraceMethod()
	public async createOrUpdateMany(items: Partial<D>[], trace?: TraceOptions): Promise<D[]> {
		trace?.span.updateName(`Mikro-Orm - createOrUpdateMany ${this.entityType.name}`);
		logger.trace(`Running create or update many for ${this.entityType.name} with args`, {
			items: JSON.stringify(items),
		});

		const entities = await this.database.transactional<D[]>(async () => {
			return Promise.all<D>(
				items.map(async (item) => {
					let entity;
					const { id } = item as any;
					if (id) {
						entity = await this.database.em.findOneOrFail(this.entityType, id, {
							populate: [
								...this.visitPathForPopulate(this.entityType.name, item),
							] as `${string}.`[],
						});
						logger.trace(`Running update on ${this.entityType.name} with item`, {
							item: JSON.stringify(item),
						});
						await this.mapAndAssignKeys(entity, this.entityType, item);
					} else {
						entity = new this.entityType();
						await this.mapAndAssignKeys(entity, this.entityType, item);
						logger.trace(`Running create on ${this.entityType.name} with item`, {
							item: JSON.stringify(item),
						});
					}
					this.database.em.persist(entity);
					return entity;
				})
			);
		});

		logger.trace(`created or updated ${this.entityType.name} items `, entities);

		return entities;
	}

	@TraceMethod()
	public async createOne(createArgs: Partial<D>, trace?: TraceOptions): Promise<D> {
		trace?.span.updateName(`Mikro-Orm - createOne ${this.entityType.name}`);
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: JSON.stringify(createArgs),
		});

		const entity = new this.entityType();
		await this.mapAndAssignKeys(entity, this.entityType, createArgs);
		await this.database.em.persistAndFlush(entity as Partial<D>);

		logger.trace(`create ${this.entityType.name} result`, entity);

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
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: JSON.stringify(createItems),
		});

		const entities = await this.database.transactional<D[]>(async () => {
			return Promise.all<D>(
				createItems.map(async (item) => {
					const entity = new this.entityType();
					await this.mapAndAssignKeys(entity, this.entityType, item);
					this.database.em.persist(entity as Partial<D>);
					return entity;
				})
			);
		});

		logger.trace(`created ${this.entityType.name} items `, entities);

		return entities;
	}

	@TraceMethod()
	public async deleteOne(filter: Filter<D>, trace?: TraceOptions): Promise<boolean> {
		trace?.span.updateName(`Mikro-Orm - deleteOne ${this.entityType.name}`);
		logger.trace(filter, `Running delete ${this.entityType.name} with filter.`);
		const where = filter ? gqlToMikro(JSON.parse(JSON.stringify(filter))) : undefined;
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
		logger.trace(`Running delete ${this.entityType.name}`);

		const deletedRows = await this.database.transactional<number>(async () => {
			const where = filter ? gqlToMikro(JSON.parse(JSON.stringify(filter))) : undefined;
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
		logger.trace(`Running aggregate ${this.entityType.name} with filter`, {
			filter: JSON.stringify(filter),
		});

		// Strip custom types out of the equation.
		// This query only works if we JSON.parse(JSON.stringify(filter)):
		//
		// query {
		//   drivers (filter: { region: { name: "North Shore" }}) {
		//     id
		//   }
		// }
		const where = filter ? gqlToMikro(JSON.parse(JSON.stringify(filter))) : undefined;

		// Convert from: { account: {id: '6' }}
		// to { accountId: '6' }
		// This conversion only works on root level objects
		const whereWithAppliedExternalIdFields = where
			? this.applyExternalIdFields(this.entityType, where)
			: {};

		// Regions need some fancy handling with Query Builder. Process the where further
		// and return a Query Builder instance.
		const query = this.em.createQueryBuilder(this.entityType);

		// Certain query filters can result in duplicate records once all joins are resolved
		// These duplicates can be discarded as related entities are returned to the
		// API consumer via field resolvers
		query.setFlag(QueryFlag.DISTINCT);

		if (Object.keys(whereWithAppliedExternalIdFields).length > 0) {
			query.andWhere(whereWithAppliedExternalIdFields);
		}

		const result: AggregationResult = {};

		try {
			if (requestedAggregations.has(AggregationType.COUNT)) {
				const meta = this.database.em.getMetadata().get(this.entityType.name);
				result.count = await query.getCount(meta.primaryKeys);
			}
		} catch (err) {
			logger.error(`find ${this.entityType.name} error: ${JSON.stringify(err)}`);

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
