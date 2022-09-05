import { BackendProvider, GraphQLEntity, PaginationOptions } from '@exogee/base-resolver';
import { logger } from '@exogee/logger';
// import { assign } from './assign';

import { HTTPDataSource } from 'apollo-datasource-http';
import pluralize from 'pluralize';

export class RestBackendProvider
<
	T,
	G extends GraphQLEntity<T>
> extends HTTPDataSource implements BackendProvider<T>  {
	private readonly gqlTypeName: string;
	public readonly backendId = 'rest-api';

	public entityType: new () => T;

	public readonly supportsInFilter = true;

    public constructor(restType: new () => T, gqlType: new (dataEntity: T) => G) {
        super('https://dogsandowners.free.beeceptor.com');
		this.entityType = restType;
		this.gqlTypeName = gqlType.name;
	}

    mapAndAssignKeys = <T>(result: T, entityType: new () => T, inputArgs: Partial<T>) => {
        // Clean the input and remove any GraphQL classes from the object
        const cleanInput = JSON.parse(JSON.stringify(inputArgs));
        // return assign(result, cleanInput);
		return undefined; // TODO remove this, uncomment the line above, and copy assign.ts into the project
    };
    
    public async find(
		filter: any, // @todo: Create a type for this
		pagination?: PaginationOptions,
		additionalOptionsForBackend?: any // @todo: Create a type for this
	): Promise<T[]> {
		logger.trace(`Running find ${this.entityType.name} with filter`, {
			filter: JSON.stringify(filter),
		});

        const plural = pluralize(this.entityType.name);
		const result = await this.get(`/${plural}`);

		logger.trace(`find ${this.entityType.name} result: ${result.headers['content-length'] ?? '?'} rows`);

		return result.body as T[];
	}

    public async findOne(id: string): Promise<T | null> {
		logger.trace(`Running findOne ${this.entityType.name} with ID ${id}`);
        
        const plural = pluralize(this.entityType.name);
		const result = await this.get(`/${plural}/${id}`);

		logger.trace(`findOne ${this.entityType.name} result`, { result });

		return result.body as T;
	}

	public async findByRelatedId(
		entity: any,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: any
	): Promise<T[]> {

        // TODO
		return [] as T[];
	}

	public async updateOne(id: string, updateArgs: Partial<T & { version?: number }>): Promise<T> {
		logger.trace(`Running update ${this.entityType.name} with args`, {
			id,
			updateArgs: JSON.stringify(updateArgs),
		});

        const entity = undefined as unknown;

		// logger.trace(`update ${this.entityType.name} entity`, entity);

		return entity as T;
	}

	public async updateMany(updateItems: (Partial<T> & { id: string })[]): Promise<T[]> {
		logger.trace(`Running update many ${this.entityType.name} with args`, {
			updateItems: JSON.stringify(updateItems),
		});

        const entities = undefined as unknown;

		// logger.trace(`updated ${this.entityType.name} items `, entities);

		return entities as T[];
	}

	public async createOrUpdateMany(items: Partial<T>[]): Promise<T[]> {
		logger.trace(`Running create or update many for ${this.entityType.name} with args`, {
			items: JSON.stringify(items),
		});

        const entities = undefined as unknown;

		// logger.trace(`created or updated ${this.entityType.name} items `, entities);

		return entities as [];
	}

	public async createOne(createArgs: Partial<T>): Promise<T> {
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: JSON.stringify(createArgs),
		});

        const entity = undefined as unknown;

		// logger.trace(`create ${this.entityType.name} result`, entity);

		return entity as T;
	}

	public async createMany(createItems: Partial<T>[]): Promise<T[]> {
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: JSON.stringify(createItems),
		});

        const entities = undefined as unknown;

		// logger.trace(`created ${this.entityType.name} items `, entities);

		return entities as T[];
	}

	public async deleteOne(id: string): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with id ${id}`);

		// logger.trace(`delete ${this.entityType.name} result: deleted ${deletedRows} row(s)`);

		return true;
	}

	public async deleteMany(ids: string[]): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with ids ${ids}`);

		// logger.trace(`delete ${this.entityType.name} result: deleted ${deletedRows} row(s)`);

		return true;
	}

    public getRelatedEntityId(entity: any, relatedIdField: string) {
		if (typeof entity.unwrap !== 'function') {
			throw new Error('Could not unwrap related entity');
		}

		return entity.unwrap().id;
	}

	public isCollection(entity: any) {
		return false;
	}
}