import path from 'node:path';
import { TraceMethod } from '@exogee/graphweaver';
import type {
	BackendProvider,
	Filter,
	PaginationOptions,
	TraceOptions,
	EntityMetadata,
	BackendProviderConfig,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import got, { Options as GotOptions, Method } from 'got-cjs';
import { inMemoryFilterFor } from './utils';

export type AccessorParams = {
	filter?: Record<string, any>;
	pagination?: PaginationOptions;
};
export interface RestDataAccessor<T> {
	find: (args: AccessorParams) => Promise<T[]>;
}

export interface FieldConfig {
	transform?: FieldTransformer;
}

export interface FieldTransformer {
	fromApi?: (fieldValue: unknown, dataObject: unknown) => any;
	toApi?: (value: any, dataObject: unknown) => unknown;
}

export interface RestBackendProviderConfig<D = unknown> {
	baseUrl: string;
	defaultPath?: string;
	defaultResultKey?: string;
	endpointOverrides?: {
		create?: { path?: string; method?: Method; resultKey?: string };
		list?: { path?: string; method?: Method; resultKey?: string };
		getOne?: { path?: string; method?: Method; resultKey?: string };
		update?: { path?: string; method?: Method; resultKey?: string };
		delete?: { path?: string; method?: Method; resultKey?: string };
	};
	fieldConfig?: { [fieldName in keyof D]: FieldConfig };
	clientOptions?: GotOptions;

	// This is an optional setting that allows you to control how this provider is displayed in the Admin UI.
	// If you do not set a value, it will default to 'REST (hostname of baseUrl)'. Entities are grouped by
	// their backend's display name, so if you want to group them in a more specific way, this is the way to do it.
	displayName?: string;

	// This is an optional setting that allows you to control how relationships are loaded.
	// The default is 'find' which will list all rows on the endpoint and filter in memory.
	// If you swap to 'findOne' it will do an individual REST find for each row that's needed,
	// which is useful if your result set is too large to filter in memory, or if you're usually
	// fetching small amounts of this entity from a much larger result.
	relationshipLoadingMethod?: 'find' | 'findOne';
}

export class RestBackendProvider<D = unknown> implements BackendProvider<D> {
	public readonly backendId;
	public readonly backendDisplayName;
	public readonly backendProviderConfig: BackendProviderConfig;

	public constructor(protected config: RestBackendProviderConfig<D>) {
		this.backendId = `rest-provider-${path.posix.join(config.baseUrl, config.defaultPath ?? '')}`;
		this.backendDisplayName = config.displayName ?? `REST (${new URL(config.baseUrl).hostname})`;
		this.backendProviderConfig = { idListLoadingMethod: config.relationshipLoadingMethod };
	}

	// GET METHODS
	@TraceMethod()
	public async find(
		filter: Filter<D>,
		pagination?: PaginationOptions,
		entityMetadata?: EntityMetadata,
		trace?: TraceOptions
	): Promise<D[]> {
		trace?.span.updateName(`Rest - find`);

		if (!entityMetadata) throw new Error('Entity metadata is required for REST provider.');

		const method = this.config.endpointOverrides?.list?.method ?? 'get';
		const url = path.posix.join(
			this.config.baseUrl,
			this.config.endpointOverrides?.list?.path ?? this.config.defaultPath ?? ''
		);

		logger.trace(
			{ filter, method, url },
			`Rest Adapter: Find executing ${method} request to ${url} with filter.`
		);

		try {
			let result: D[] = await got(url, {
				method,
				...this.config.clientOptions,
			}).json();

			logger.trace({ result }, `Rest Adapter: Result returned from API.`);

			const resultKey =
				this.config.endpointOverrides?.list?.resultKey ?? this.config.defaultResultKey;

			if (resultKey) {
				logger.trace(`Rest Adapter: Result key is '${resultKey}', extracting from result.`);

				// If they've given us a result key it means the result is something like { data: [] }
				// or { rows: [] } and we need to grab the array out of the object we now have.
				result = (result as unknown as Record<string, D[]>)[resultKey];
			}

			if (!Array.isArray(result)) {
				logger.error(
					{ result, resultKey },
					'Rest Adapter: Result is not an array. If the result returns an object and you need to extract an array from a certain key, provide a defaultResultKey or resultKey in the provider config for this endpoint.'
				);

				throw new Error('Result is not an array.');
			}

			logger.trace(`Rest Adapter: Find returned ${result.length} rows.`);

			// We have to do the field config transforms before filtering because the filter
			// may very well depend on the transform.
			result = this.mapWithFieldConfig(result);

			result = result.filter(inMemoryFilterFor(entityMetadata, filter));
			logger.trace(`Rest Adapter: Filtered result returned ${result.length} rows.`);

			if (pagination) {
				result = result.slice(
					pagination.offset ?? 0,
					(pagination.offset ?? 0) + (pagination.limit ?? 50)
				);
				logger.trace(`Rest Adapter: Pagination applied, result is now ${result.length} rows.`);
			}

			return result;
		} catch (error: any) {
			// Nicer error message if we can muster it.
			if (error.response?.body) throw error.response.body;

			// Otherwise it should just bubble on up.
			throw error;
		}
	}

	@TraceMethod()
	public async findOne(
		filter: Filter<D>,
		entityMetadata?: EntityMetadata,
		trace?: TraceOptions
	): Promise<D | null> {
		trace?.span.updateName(`Rest - findOne`);
		logger.trace(`Rest Adapter: Running findOne with filter ${filter}`);

		// Can we map this to a nice clean get one REST style? If so we should do that.
		const id = filter[(entityMetadata?.primaryKeyField ?? 'id') as keyof D];
		if (Object.keys(filter).length === 1 && id) {
			logger.trace(`Rest Adapter: findOne is able to use REST natively to get one with id ${id}`);

			// Ok, let's get it.
			const method = this.config.endpointOverrides?.getOne?.method ?? 'get';
			const url = path.posix.join(
				this.config.baseUrl,
				this.config.endpointOverrides?.getOne?.path ?? this.config.defaultPath ?? '',
				String(id)
			);

			logger.trace(
				{ filter, method, url },
				`Rest Adapter: Get One executing ${method} request to ${url}.`
			);

			try {
				let result: D = await got(url, {
					method,
					...this.config.clientOptions,
				}).json();

				const resultKey =
					this.config.endpointOverrides?.getOne?.resultKey ?? this.config.defaultResultKey;

				if (resultKey) {
					// If they've given us a result key it means the result is something like { data: { } }
					// or { object: { } } and we need to grab the actual result out of the object we now have.
					result = (result as unknown as Record<string, D>)[resultKey];
				}

				return this.mapWithFieldConfig([result])[0] ?? null;
			} catch (error: any) {
				// Nicer error message if we can muster it.
				if (error.response?.body) throw error.response.body;

				// Otherwise it should just bubble on up.
				throw error;
			}
		}

		// Ok, we can't, we have to list and filter down to one from there.
		const rows = await this.find(filter, undefined);
		return rows[0] ?? null;
	}

	@TraceMethod()
	public async findByRelatedId(): Promise<D[]> {
		throw new Error('Not implemented');
	}

	// PUT METHODS
	public async updateOne(): Promise<D> {
		throw new Error('Not implemented');
	}

	public async updateMany(): Promise<D[]> {
		throw new Error('Not implemented');
	}

	public async createOrUpdateMany(): Promise<D[]> {
		throw new Error('Not implemented');
	}

	// POST METHODS
	public async createOne(): Promise<D> {
		throw new Error('Not implemented');
	}

	public async createMany(): Promise<D[]> {
		throw new Error('Not implemented');
	}

	// DELETE METHODS
	public async deleteOne(): Promise<boolean> {
		throw new Error('Not implemented');
	}

	public async deleteMany(): Promise<boolean> {
		throw new Error('Not implemented');
	}

	protected mapWithFieldConfig(result: D[]) {
		if (!this.config.fieldConfig) return result;

		logger.trace(`Rest Adapter: mapping result and applying field config.`);
		return result.map((row) => {
			for (const [field, fieldConfig] of Object.entries(
				this.config.fieldConfig ?? ({} as FieldConfig)
			)) {
				if (field === '__proto__') {
					throw new Error('fieldConfig should never have a field config for __proto__');
				}

				if (fieldConfig.transform?.fromApi) {
					(row as any)[field] = fieldConfig.transform.fromApi((row as any)[field], row);
				}
			}

			return row;
		});
	}
}
