import { BackendProvider, GraphQLEntity, PaginationOptions } from '@exogee/base-resolver';
import { logger } from '@exogee/logger';

// import { HTTPDataSource } from 'apollo-datasource-http';
import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest';
import { DataSourceConfig } from 'apollo-datasource';
import pluralize from 'pluralize';

export class RestBackendProvider<T, G extends GraphQLEntity<T>>
	extends RESTDataSource
	implements BackendProvider<T> {
	private readonly gqlTypeName: string;
	public readonly backendId = 'rest-api';

	public entityType: new () => T;

	public readonly supportsInFilter = true;

	public constructor(restType: new () => T, gqlType: new (dataEntity: T) => G) {
		super();
		this.memoizeGetRequests = false;
		this.baseURL = 'https://dogsandowners.free.beeceptor.com/';
		this.initialize({} as DataSourceConfig<any>); // <===== this one resolve the issue
		// super('https://dogsandowners.free.beeceptor.com');
		// cannot use a url like https://apimocha.com/gwrestdogs with HTTPDataSource
		this.entityType = restType;
		this.gqlTypeName = gqlType.name;
	}

	// TODO: authentication
	// willSendRequest(request: RequestOptions) {
	// 	request.headers.set('Authorization', this.context.token);
	// }

	public async find(
		filter: any, // @todo: Create a type for this
		pagination?: PaginationOptions,
		additionalOptionsForBackend?: any // @todo: Create a type for this
	): Promise<T[]> {
		logger.trace(`Running find ${this.entityType.name} with filter`, {
			filter: JSON.stringify(filter),
		});

		const plural = pluralize(this.entityType.name);
		return this.get(`/${plural}`);
	}

	public async findOne(id: string): Promise<T | null> {
		logger.trace(`Running findOne ${this.entityType.name} with ID ${id}`);

		const plural = pluralize(this.entityType.name);
		return this.get(`/${plural}/${id}`);
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
		const body = JSON.stringify(updateArgs);
	
		logger.trace(`Running update ${this.entityType.name} with args`, {
			id,
			updateArgs: body,
		});

		const plural = pluralize(this.entityType.name);
		return this.put(`/${plural}/${id}`, body);
	}

	public async updateMany(updateItems: (Partial<T> & { id: string })[]): Promise<T[]> {
		const body = JSON.stringify(updateItems);
	
		logger.trace(`Running update many ${this.entityType.name} with args`, {
			updateItems: body,
		});

		const plural = pluralize(this.entityType.name);
		return this.post(`/${plural}`, body);
	}

	public async createOrUpdateMany(items: Partial<T>[]): Promise<T[]> {
		logger.trace(`Running create or update many for ${this.entityType.name} with args`, {
			items: JSON.stringify(items),
		});

		return Promise.reject();
	}

	public async createOne(createArgs: Partial<T>): Promise<T> {
		const body = JSON.stringify(createArgs);
		
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: body
		});

		const plural = pluralize(this.entityType.name);
		return this.post(`/${plural}`, body);
	}

	public async createMany(createItems: Partial<T>[]): Promise<T[]> {
		const body = JSON.stringify(createItems);
	
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: body,
		});

		const plural = pluralize(this.entityType.name);
		return this.post(`/${plural}`, body);
	}

	public async deleteOne(id: string): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with id ${id}`);

		const plural = pluralize(this.entityType.name);
		return this.delete(`/${plural}/${id}`);
	}

	public async deleteMany(ids: string[]): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with ids ${ids}`);

		const plural = pluralize(this.entityType.name);

		// if the REST API supports batch DELETE then we could do this 
		// but this client does not support a body with DELETE
		// const body = JSON.stringify(ids);
		// return this.delete(`/${plural}`)

		// if the REST API (or client) does not support batch DELETE 
		// then resort to map-reduce
		let result = true;
		return Promise.all(ids.map((id) => this.delete(`/${plural}/${id}`))).then((responses) =>
			responses.map(() => true).reduce(() => result, true)
		);
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
