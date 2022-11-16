import { BackendProvider, GraphQLEntity, PaginationOptions } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { kebabCase } from 'lodash';
import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest';
import { DataSourceConfig } from 'apollo-datasource';
import pluralize from 'pluralize';

export class RestLookupProvider<T> extends RESTDataSource {
	public entityType: new () => T;

	public constructor(restType: new () => T) {
		super();
		this.memoizeGetRequests = false;

		this.baseURL = 'https://6zd0g.mocklab.io/';
		this.initialize({} as DataSourceConfig<any>);
		this.entityType = restType;
		this.context = {
			acceptLanguage: 'en-au',
			contentType: 'application/json',
			sharedKey: 'd70a0cd87bf1ef70278df19e6ba677000ccf065bb41875d6c420d91e0c009e43',
		};
	}

	public async findAll(): Promise<T[]> {
		const plural = pluralize(this.entityType.name);
		return this.get(`/${plural}`);
	}

	public async findOne(id: string): Promise<T | null> {
		logger.trace(`Running findOne ${this.entityType.name} with ID ${id}`);

		const plural = pluralize(this.entityType.name);
		return this.get(`/${plural}/${id}`);
	}
}

export class RestBackendProvider<T, G extends GraphQLEntity<T>>
	// export class RestBackendProvider<T>
	extends RESTDataSource
	implements BackendProvider<T> {
	private readonly gqlTypeName: string;
	public readonly backendId = 'rest-api';

	public entityType: new () => T;

	public readonly supportsInFilter = true;

	public constructor(restType: new () => T, gqlType: new (dataEntity: T) => G) {
		// public constructor(restType: new () => T) {
		super();
		this.memoizeGetRequests = false;

		// this.baseURL = 'https://dogsandowners.free.beeceptor.com/'; // beeceptor returns wrong data types
		this.baseURL = 'https://6zd0g.mocklab.io/';
		// this.baseURL = 'https://apimocha.com/gwrestdogs'; // apimocha weird issue saying json is invalid at "i"
		this.initialize({} as DataSourceConfig<any>);
		this.entityType = restType;
		this.gqlTypeName = gqlType.name;
		this.context = {
			acceptLanguage: 'en-au',
			contentType: 'application/json',
			sharedKey: 'd70a0cd87bf1ef70278df19e6ba677000ccf065bb41875d6c420d91e0c009e43',
		};
	}

	// AUTHENTICATION
	willSendRequest(request: RequestOptions) {
		for (const [key, value] of Object.entries(this.context))
			request.headers.set(kebabCase(key), value as string);
		logger.trace(`Added all headers ${JSON.stringify(request.headers)}`);
	}

	// GET METHODS
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
		const plural = pluralize(this.entityType.name);
		const all = (await this.get(`/${plural}`)) as T[];
		const field = relatedField as keyof T;
		return all.filter((i) => relatedFieldIds.includes((i as any)[relatedField]));
	}

	// PUT METHODS
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

		// if the REST API does not support batch
		// then resort to map
		logger.trace(`This will execute ${updateItems.length} requests`);

		return Promise.all(
			updateItems.map((item) => this.put(`/${plural}/${item.id}`, JSON.stringify(item)))
		).then((responses) => responses.map((data) => JSON.parse(data)));
	}

	public async createOrUpdateMany(items: Partial<T>[]): Promise<T[]> {
		// not something we can do with REST
		return Promise.reject();
	}

	// POST METHODS
	public async createOne(createArgs: Partial<T>): Promise<T> {
		const body = JSON.stringify(createArgs);

		logger.trace(`Running create ${this.entityType.name} with args`, {
			createArgs: body,
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

		// if the REST API supports batch then we could do this
		// const body = JSON.stringify(ids);
		// return this.post(`/${plural}`)

		// if the REST API does not support batch
		// then resort to map

		logger.trace(`This will execute ${createItems.length} requests`);

		return Promise.all(
			createItems.map((item) => this.post(`/${plural}`, JSON.stringify(item)))
		).then((responses) => responses.map((data) => JSON.parse(data)));
	}

	// DELETE METHODS
	public async deleteOne(id: string): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with id ${id}`);

		const plural = pluralize(this.entityType.name);
		return this.delete(`/${plural}/${id}`);
	}

	public async deleteMany(ids: string[]): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with ids ${ids}`);

		const plural = pluralize(this.entityType.name);

		// if the REST API supports batch then we could do this
		// but this client does not support a body with DELETE
		// const body = JSON.stringify(ids);
		// return this.delete(`/${plural}`)

		// if the REST API (or client) does not support batch
		// then resort to map-reduce

		logger.trace(`This will execute ${ids.length} requests`);

		return Promise.all(ids.map((id) => this.delete(`/${plural}/${id}`))).then((responses) =>
			responses.map(() => true).reduce(this.reduceBooleanArray, true)
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

	reduceBooleanArray(cumulative: boolean, current: boolean) {
		return cumulative && current;
	}
}
