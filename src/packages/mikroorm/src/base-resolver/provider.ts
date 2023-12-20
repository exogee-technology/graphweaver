import {
	BackendProvider,
	PaginationOptions,
	Sort,
	Filter,
	GraphQLEntity,
	BaseDataEntity,
	BackendProviderConfig,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

import {
	FilterQuery,
	LockMode,
	QueryFlag,
	ReferenceType,
	Utils,
	ConnectionManager,
	externalIdFieldMap,
	AnyEntity,
	IsolationLevel,
	ConnectionOptions,
	ClearDatabaseContext,
	connectToDatabase,
} from '..';

import { OptimisticLockError } from '../utils/errors';
import { assign } from './assign';

import { QueryBuilder, SqlEntityRepository } from '@mikro-orm/postgresql';
import { ApolloServerPlugin, BaseContext } from '@apollo/server';

type PostgresError = {
	code: string;
	routine: string;
};

const objectOperations = new Set(['_and', '_or', '_not']);
const mikroObjectOperations = new Set(['$and', '$or', '$not']);
const nonJoinKeys = new Set([
	'$and',
	'$gt',
	'$gte',
	'$in',
	'$lt',
	'$lte',
	'$ne',
	'$nin',
	'$not',
	'$or',
	'$like',
	'$ilike',
	'$null',
	'$notnull',
	'id', // @todo: remove this? Why is it here?
]);

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
export class MikroBackendProvider<D extends BaseDataEntity, G extends GraphQLEntity<D>>
	implements BackendProvider<D, G>
{
	private _backendId: string;

	private connection: ConnectionOptions;

	public entityType: new () => D;
	public connectionManagerId?: string;
	private transactionIsolationLevel!: IsolationLevel;

	public readonly supportsInFilter = true;

	// Default backend provider config
	public readonly backendProviderConfig: BackendProviderConfig = {
		filter: {
			root: true,
			parentByChild: true,
			childByChild: true,
		},
		pagination: {
			root: false,
			offset: false,
			limit: false,
		},
		orderBy: {
			root: false,
		},
		sort: {
			root: false,
		},
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

	private getRepository: () => SqlEntityRepository<D> = () => {
		const repository = this.database.em.getRepository<D>(this.entityType);
		if (!repository) throw new Error('Could not find repository for ' + this.entityType.name);

		return repository as SqlEntityRepository<D>;
	};

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
	}

	private mapAndAssignKeys = (result: D, entityType: new () => D, inputArgs: Partial<G>) => {
		// Clean the input and remove any GraphQL classes from the object
		// const cleanInput = JSON.parse(JSON.stringify(inputArgs));
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
				properties[key]?.reference === ReferenceType.ONE_TO_ONE ||
				properties[key]?.reference === ReferenceType.ONE_TO_MANY ||
				properties[key]?.reference === ReferenceType.MANY_TO_ONE ||
				properties[key]?.reference === ReferenceType.MANY_TO_MANY
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

	public async find(
		filter: Filter<G>,
		pagination?: PaginationOptions,
		additionalOptionsForBackend?: any // @todo: Create a type for this
	): Promise<D[]> {
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
		const where = filter ? gqlToMikro(JSON.parse(JSON.stringify(filter))) : undefined;

		// Convert from: { account: {id: '6' }}
		// to { accountId: '6' }
		// This conversion only works on root level objects
		const whereWithAppliedExternalIdFields = where
			? this.applyExternalIdFields(this.entityType, where)
			: {};

		// Regions need some fancy handling with Query Builder. Process the where further
		// and return a Query Builder instance.
		const query = this.getRepository().createQueryBuilder();
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

		if (additionalOptionsForBackend?.populate) {
			query.populate(additionalOptionsForBackend.populate);
		}

		try {
			const result = await query.getResult();
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

	public async findOne(filter: Filter<G>): Promise<D | null> {
		logger.trace(`Running findOne ${this.entityType.name} with filter ${filter}`);

		const [result] = await this.find(filter, { orderBy: { id: Sort.DESC }, offset: 0, limit: 1 });

		logger.trace(`findOne ${this.entityType.name} result`, { result });

		return result;
	}

	public async findByRelatedId(
		entity: any,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: any
	): Promise<D[]> {
		const queryFilter = {
			$and: [{ [relatedField]: { $in: relatedFieldIds } }, ...[filter ?? []]],
		};

		const populate = [relatedField as `${string}.`];
		const result = await this.database.em.find(entity, queryFilter, {
			populate,
		});

		return result as D[];
	}

	public async updateOne(id: string, updateArgs: Partial<G & { version?: number }>): Promise<D> {
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

		// If a version has been sent, let's check it
		if (updateArgs?.version) {
			try {
				await this.database.em.lock(entity, LockMode.OPTIMISTIC, updateArgs.version);
				delete updateArgs.version;
			} catch (err) {
				throw new OptimisticLockError((err as Error)?.message, { entity });
			}
		}

		await this.mapAndAssignKeys(entity, this.entityType, updateArgs);
		await this.getRepository().persistAndFlush(entity);

		logger.trace(`update ${this.entityType.name} entity`, entity);

		return entity;
	}

	public async updateMany(updateItems: (Partial<G> & { id: string })[]): Promise<D[]> {
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

	public async createOrUpdateMany(items: Partial<G>[]): Promise<D[]> {
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

	public async createOne(createArgs: Partial<G>): Promise<D> {
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: JSON.stringify(createArgs),
		});

		const entity = new this.entityType();
		await this.mapAndAssignKeys(entity, this.entityType, createArgs);
		await this.getRepository().persistAndFlush(entity);

		logger.trace(`create ${this.entityType.name} result`, entity);

		return entity;
	}

	public async createMany(createItems: Partial<G>[]): Promise<D[]> {
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: JSON.stringify(createItems),
		});

		const entities = await this.database.transactional<D[]>(async () => {
			return Promise.all<D>(
				createItems.map(async (item) => {
					const entity = new this.entityType();
					await this.mapAndAssignKeys(entity, this.entityType, item);
					this.database.em.persist(entity);
					return entity;
				})
			);
		});

		logger.trace(`created ${this.entityType.name} items `, entities);

		return entities;
	}

	public async deleteOne(filter: Filter<G>): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with filter ${filter}`);
		const where = filter ? gqlToMikro(JSON.parse(JSON.stringify(filter))) : undefined;
		const whereWithAppliedExternalIdFields =
			where && this.applyExternalIdFields(this.entityType, where);

		const deletedRows = await this.getRepository().nativeDelete(whereWithAppliedExternalIdFields);

		if (deletedRows > 1) {
			throw new Error('Multiple deleted rows');
		}

		logger.trace(`delete ${this.entityType.name} result: deleted ${deletedRows} row(s)`);

		return deletedRows === 1;
	}

	public async deleteMany(ids: string[]): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with ids ${ids}`);

		const deletedRows = await this.database.transactional<number>(async () => {
			const deletedCount = await this.getRepository().nativeDelete({
				id: { $in: ids },
			} as FilterQuery<any>); // We can remove this cast when Typescript knows that T has an `id` property.

			if (deletedCount !== ids.length) {
				throw new Error('We did not delete all the rows, rolling back');
			}

			return deletedCount;
		});

		logger.trace(`delete ${this.entityType.name} result: deleted ${deletedRows} row(s)`);

		return deletedRows === ids.length;
	}

	public getRelatedEntityId(entity: any, relatedIdField: string) {
		if (typeof entity === 'string') {
			return entity;
		}
		if (entity.id) {
			return entity.id;
		}
		// No need to unwrap in Mikroorm version 5
		throw new Error(`Unknown entity without an id: ${JSON.stringify(entity)}`);
	}

	public isCollection(entity: any) {
		return Utils.isCollection(entity);
	}

	public get plugins(): ApolloServerPlugin<BaseContext>[] {
		return [ClearDatabaseContext, connectToDatabase(this.connection)];
	}
}
