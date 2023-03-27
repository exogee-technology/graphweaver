import { BackendProvider, PaginationOptions } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

import {
	Database,
	FilterQuery,
	LockMode,
	QueryFlag,
	ReferenceType,
	SqlEntityRepository,
	Utils,
	cm,
} from '..';
import { OptimisticLockError } from '../utils/errors';
import { assign } from './assign';

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

// Check if we have any keys that are a collection of entities
export const visitPathForPopulate = (
	entityName: string,
	updateArgBranch: any,
	populateBranch = ''
) => {
	const { properties } = Database.em.getMetadata().get(entityName);
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
					const newPaths = visitPathForPopulate(
						properties[key].type,
						entry,
						appendPath(populateBranch, key)
					);
					newPaths.forEach((path) => collectedPaths.add(path));
				}
			} else if (typeof value === 'object') {
				// Recurse
				const newPaths = visitPathForPopulate(
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

export const mapAndAssignKeys = <T>(result: T, entityType: new () => T, inputArgs: Partial<T>) => {
	// Clean the input and remove any GraphQL classes from the object
	const cleanInput = JSON.parse(JSON.stringify(inputArgs));
	return assign(result, cleanInput);
};

// eslint-disable-next-line @typescript-eslint/ban-types
export class MikroBackendProvider<T extends {}> implements BackendProvider<T> {
	public readonly backendId = 'mikro-orm';

	public entityType: new () => T;
	public connectionManagerId?: string;

	public readonly supportsInFilter = true;

	private get database() {
		// If we have a connection manager ID then use that else fallback to the Database
		if (!this.connectionManagerId) return Database;
		return cm.database(this.connectionManagerId) || Database;
	}

	private getRepository: () => SqlEntityRepository<T> = () => {
		const repository = this.database.em.getRepository<T>(this.entityType);
		if (!repository) throw new Error('Could not find repository for ' + this.entityType.name);

		return repository as SqlEntityRepository<T>;
	};

	public constructor(mikroType: new () => T, connectionManagerId?: string) {
		this.entityType = mikroType;
		this.connectionManagerId = connectionManagerId;
	}

	private applyWhereClause(where: any) {
		const query = this.getRepository().createQueryBuilder();
		const joinKeysUsed = new Map<string, number>();

		if (where) {
			const visit = (current: any, table = 'e0') => {
				if (Array.isArray(current)) {
					for (const element of current) {
						visit(element, table);
					}
				} else if (typeof current === 'object') {
					for (const key of Object.keys(current)) {
						const shouldJoin =
							current[key] !== null &&
							typeof current[key] === 'object' &&
							Object.keys(current[key]).filter((key) => !nonJoinKeys.has(key)).length > 0;

						// Only join if it's not $and, $or, $not, and if it's one of those object operations
						// pass the parent and current table on down without any change.
						if (mikroObjectOperations.has(key)) {
							visit(current[key], table);
						} else if (shouldJoin) {
							// Otherwise ensure we've actually got a full on nested object,
							// not just a filter property.
							const keyUseCount = joinKeysUsed.has(key) ? (joinKeysUsed.get(key) ?? 0) + 1 : 1;
							const joinKey = joinKeysUsed.has(key) ? `${key}${keyUseCount}` : key;
							query.leftJoin(`${table}.${key}`, joinKey);
							// Certain filters can result in the same table being joined
							// on different criteria - keep track and avoid using the same alias
							joinKeysUsed.set(joinKey, keyUseCount);
							visit(current[key], key);
						}

						// Filter out empty objects
						if (
							current[key] !== null &&
							typeof current[key] === 'object' &&
							Object.keys(current[key]).length === 0
						) {
							delete current[key];
						}
					}
				}
			};

			visit(where);

			if (Object.keys(where).length > 0) {
				query.andWhere(where);
			}
		}

		return query;
	}

	public async find(
		filter: any, // @todo: Create a type for this
		pagination?: PaginationOptions,
		additionalOptionsForBackend?: any // @todo: Create a type for this
	): Promise<T[]> {
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

		// Regions need some fancy handling with Query Builder. Process the where further
		// and return a Query Builder instance.
		const query = this.applyWhereClause(where);

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

		const result = await query.getResult();
		logger.trace(`find ${this.entityType.name} result: ${result.length} rows`);

		return result;
	}

	public async findOne(id: string): Promise<T | null> {
		logger.trace(`Running findOne ${this.entityType.name} with ID ${id}`);

		const result = await this.database.em.findOne(this.entityType, id);

		logger.trace(`findOne ${this.entityType.name} result`, { result });

		return result;
	}

	public async findByRelatedId(
		entity: any,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: any
	): Promise<T[]> {
		const queryFilter = {
			$and: [{ [relatedField]: { $in: relatedFieldIds } }, ...[filter ?? []]],
		};

		const populate = [relatedField as `${string}.`];
		const result = (await this.database.em.find(entity, queryFilter, { populate })) as unknown[];

		return result as T[];
	}

	public async updateOne(id: string, updateArgs: Partial<T & { version?: number }>): Promise<T> {
		logger.trace(`Running update ${this.entityType.name} with args`, {
			id,
			updateArgs: JSON.stringify(updateArgs),
		});

		const entity = await this.database.em.findOne(this.entityType, id, {
			// This is an optimisation so that assign() doesn't have to go fetch everything one at a time.
			populate: [...visitPathForPopulate(this.entityType.name, updateArgs)] as `${string}.`[],
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

		await mapAndAssignKeys(entity, this.entityType, updateArgs);
		await this.getRepository().persistAndFlush(entity);

		logger.trace(`update ${this.entityType.name} entity`, entity);

		return entity;
	}

	public async updateMany(updateItems: (Partial<T> & { id: string })[]): Promise<T[]> {
		logger.trace(`Running update many ${this.entityType.name} with args`, {
			updateItems: JSON.stringify(updateItems),
		});

		const entities = await this.database.transactional<T[]>(async () => {
			return Promise.all<T>(
				updateItems.map(async (item) => {
					if (!item?.id) throw new Error('You must pass an ID for this entity to update it.');

					// Find the entity in the database
					const entity = await this.database.em.findOneOrFail(this.entityType, item.id, {
						populate: [...visitPathForPopulate(this.entityType.name, item)] as `${string}.`[],
					});
					await mapAndAssignKeys(entity, this.entityType, item);
					this.database.em.persist(entity);
					return entity;
				})
			);
		});

		logger.trace(`updated ${this.entityType.name} items `, entities);

		return entities;
	}

	public async createOrUpdateMany(items: Partial<T>[]): Promise<T[]> {
		logger.trace(`Running create or update many for ${this.entityType.name} with args`, {
			items: JSON.stringify(items),
		});

		const entities = await this.database.transactional<T[]>(async () => {
			return Promise.all<T>(
				items.map(async (item) => {
					let entity;
					const { id } = item as any;
					if (id) {
						entity = await this.database.em.findOneOrFail(this.entityType, id, {
							populate: [...visitPathForPopulate(this.entityType.name, item)] as `${string}.`[],
						});
						logger.trace(`Running update on ${this.entityType.name} with item`, {
							item: JSON.stringify(item),
						});
						await mapAndAssignKeys(entity, this.entityType, item);
					} else {
						entity = new this.entityType();
						await mapAndAssignKeys(entity, this.entityType, item);
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

	public async createOne(createArgs: Partial<T>): Promise<T> {
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: JSON.stringify(createArgs),
		});

		const entity = new this.entityType();
		await mapAndAssignKeys(entity, this.entityType, createArgs);
		await this.getRepository().persistAndFlush(entity);

		logger.trace(`create ${this.entityType.name} result`, entity);

		return entity;
	}

	public async createMany(createItems: Partial<T>[]): Promise<T[]> {
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: JSON.stringify(createItems),
		});

		const entities = await this.database.transactional<T[]>(async () => {
			return Promise.all<T>(
				createItems.map(async (item) => {
					const entity = new this.entityType();
					await mapAndAssignKeys(entity, this.entityType, item);
					this.database.em.persist(entity);
					return entity;
				})
			);
		});

		logger.trace(`created ${this.entityType.name} items `, entities);

		return entities;
	}

	public async deleteOne(id: string): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with id ${id}`);
		const deletedRows = await this.getRepository().nativeDelete({
			id,
		} as unknown as FilterQuery<T>);

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
}
