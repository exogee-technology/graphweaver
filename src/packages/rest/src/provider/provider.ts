import {
	BackendProvider as Provider,
	Filter,
	PaginationOptions,
	BackendProviderConfig,
	TraceMethod,
	TraceOptions,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

export type AccessorParams = {
	filter?: Record<string, any>;
	pagination?: PaginationOptions;
};
export interface RestDataAccessor<T> {
	find: (args: AccessorParams) => Promise<T[]>;
}

export class RestBackendProvider<D = unknown> implements Provider<D> {
	public readonly backendId = 'rest-api';
	public constructor(
		protected entityTypeName: string,
		protected accessor?: RestDataAccessor<D>
	) {}

	// Default backend provider config
	public readonly backendProviderConfig: BackendProviderConfig = {
		filter: false,
		pagination: false,
		orderBy: false,
		sort: false,
	};

	// GET METHODS
	@TraceMethod()
	public async find(
		filter: Filter<D>,
		pagination?: PaginationOptions,
		trace?: TraceOptions
	): Promise<D[]> {
		trace?.span.updateName(`Rest - find`);
		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Rest Backend Provider that does not have an accessor.'
			);
		}

		try {
			const result = await this.accessor.find({
				filter,
				pagination,
			});

			logger.trace(
				`Find ${this.entityTypeName} with filter ${JSON.stringify(
					filter
				)} and pagination ${JSON.stringify(pagination)} returned ${result.length} rows.`
			);

			return result;
		} catch (error: any) {
			// Nicer error message if we can muster it.
			if (error.response?.body) throw error.response.body;

			throw error;
		}
	}

	@TraceMethod()
	public async findOne(filter: Filter<D>, trace?: TraceOptions): Promise<D | null> {
		trace?.span.updateName(`Rest - findOne`);
		logger.trace(`Running findOne ${this.entityTypeName} with Filter ${filter}`);

		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Rest Backend Provider that does not have an accessor.'
			);
		}

		const rows = await this.find(filter, undefined);
		return rows[0] || null;
	}

	@TraceMethod()
	public async findByRelatedId(
		entity: unknown,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: Filter<D>,
		trace?: TraceOptions
	): Promise<D[]> {
		trace?.span.updateName(`Rest - findByRelatedId`);
		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Rest Backend Provider that does not have an accessor.'
			);
		}

		const orFilters = relatedFieldIds.map((id) => ({ [relatedField]: id }));

		return this.find(
			{
				_or: orFilters,
				...filter,
			} as Filter<D>,
			undefined
		);
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
}
