import {
	BackendProvider as Provider,
	BaseDataEntity as DE,
	Filter,
	GraphQLEntity as GE,
	PaginationOptions,
	BackendProviderConfig,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

export type AccessorParams = {
	filter?: Record<string, any>;
	pagination?: PaginationOptions;
};
export interface RestDataAccessor<T> {
	find: (args: AccessorParams) => Promise<T[]>;
}

export class RestBackendProvider<D extends DE, G extends GE<D>> implements Provider<D, G> {
	public readonly backendId = 'rest-api';
	public constructor(protected entityTypeName: string, protected accessor?: RestDataAccessor<D>) {}

	// Default backend provider config
	public readonly backendProviderConfig: BackendProviderConfig = {
		filter: {
			root: false,
			parentByChild: false,
			childByChild: false,
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

	// GET METHODS
	public async find(filter: Filter<G>, pagination?: PaginationOptions): Promise<D[]> {
		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		try {
			const result = await this.accessor.find({
				filter,
				pagination: pagination,
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

	public async findOne(filter: Filter<G>): Promise<D | null> {
		logger.trace(`Running findOne ${this.entityTypeName} with Filter ${filter}`);

		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		const rows = await this.find(filter);
		return rows[0] || null;
	}

	public async findByRelatedId(
		entity: unknown,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: Filter<G>
	): Promise<D[]> {
		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		const orFilters: Filter<G>[] = relatedFieldIds.map((id) => ({ [relatedField]: id }));

		return this.find({
			_or: orFilters,
			...filter,
		});
	}

	// PUT METHODS
	public async updateOne(id: string, updateArgs: Partial<G & { version?: number }>): Promise<D> {
		logger.trace(`Running update one ${this.entityTypeName} with args`, {
			id,
			updateArgs,
		});

		throw new Error('Not implemented');
	}

	public async updateMany(updateItems: (Partial<G> & { id: string })[]): Promise<D[]> {
		logger.trace(`Running update many ${this.entityTypeName} with args`, {
			updateItems: updateItems,
		});

		throw new Error('Not implemented');
	}

	public async createOrUpdateMany(items: Partial<G>[]): Promise<D[]> {
		// not something we can do with REST
		return Promise.reject();
	}

	// POST METHODS
	public async createOne(createArgs: Partial<G>): Promise<D> {
		throw new Error('Not implemented');
	}

	public async createMany(createItems: Partial<G>[]): Promise<D[]> {
		logger.trace(`Running create ${this.entityTypeName} with args`, {
			createItems,
		});

		throw new Error('Not implemented');
	}

	// DELETE METHODS
	public async deleteOne(filter: Filter<G>): Promise<boolean> {
		logger.trace(`Running delete ${this.entityTypeName} with filter ${filter}`);

		throw new Error('Not implemented');
	}

	public async deleteMany(ids: string[]): Promise<boolean> {
		logger.trace(`Running delete ${this.entityTypeName} with ids ${ids}`);

		throw new Error('Not implemented');
	}

	public getRelatedEntityId(entity: any, relatedIdField: string) {
		if (typeof entity === 'string') {
			return entity;
		}
		if (entity.id) {
			return entity.id;
		}
		throw new Error(`Unknown entity without an id: ${JSON.stringify(entity)}`);
	}

	public isCollection(entity: unknown) {
		return false;
	}
}
