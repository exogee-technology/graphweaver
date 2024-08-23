import path from 'node:path';
import {
	BackendProvider,
	Filter,
	PaginationOptions,
	TraceMethod,
	TraceOptions,
	EntityMetadata,
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
	transform?: {
		fromApi?: (value: unknown) => any;
		toApi?: (value: any) => unknown;
	};
}

export interface RestBackendProviderConfig<D = unknown> {
	baseUrl: string;
	defaultPath?: string;
	endpointOverrides?: {
		create?: { path?: string; method?: Method };
		list?: { path?: string; method?: Method };
		getOne?: { path?: string; method?: Method };
		update?: { path?: string; method?: Method };
		delete?: { path?: string; method?: Method };
	};
	fieldConfig?: { [fieldName in keyof D]: FieldConfig };
	clientOptions?: GotOptions;
}

export class RestBackendProvider<D = unknown> implements BackendProvider<D> {
	public readonly backendId = 'rest-api';
	public constructor(protected config: RestBackendProviderConfig<D>) {}

	// GET METHODS
	@TraceMethod()
	public async find(
		filter: Filter<D>,
		pagination?: PaginationOptions,
		trace?: TraceOptions
	): Promise<D[]> {
		trace?.span.updateName(`Rest - find`);

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
			let result = await got(url, {
				method,
				...this.config.clientOptions,
			}).json<D[]>();

			logger.trace(`Rest Adapter: Find returned ${result.length} rows.`);

			result = result.filter(inMemoryFilterFor(filter));
			logger.trace(`Rest Adapter: Filtered result returned ${result.length} rows.`);

			if (pagination) {
				result = result.slice(pagination.offset, pagination.offset + pagination.limit);
				logger.trace(`Rest Adapter: Pagination applied, result is now ${result.length} rows.`);
			}

			return this.mapWithFieldConfig(result);
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
				const result = await got(url, {
					method,
					...this.config.clientOptions,
				}).json<D>();

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
				if (fieldConfig.transform?.fromApi) {
					(row as any)[field] = fieldConfig.transform.fromApi((row as any)[field]);
				}
			}

			return row;
		});
	}
}
