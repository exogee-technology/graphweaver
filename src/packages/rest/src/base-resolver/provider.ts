import { BackendProvider, PaginationOptions } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

export type AccessorParams = {
	filter?: Record<string, any>;
	pagination?: PaginationOptions;
};
export interface RestDataAccessor<T> {
	find: (args: AccessorParams) => Promise<T[]>;
}

export class RestBackendProvider<T> implements BackendProvider<T> {
	public readonly backendId = 'rest-api';
	public constructor(protected entityTypeName: string, protected accessor?: RestDataAccessor<T>) {}

	// GET METHODS
	public async find(filter: Record<string, any>, pagination?: PaginationOptions): Promise<T[]> {
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

	public async findOne(filter: any): Promise<T | null> {
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
		filter?: Record<string, any>
	): Promise<T[]> {
		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		return this.find({
			_or: [relatedFieldIds.map((id) => ({ [relatedField]: id }))],
			...filter,
		});
	}

	// PUT METHODS
	public async updateOne(id: string, updateArgs: Partial<T & { version?: number }>): Promise<T> {
		logger.trace(`Running update one ${this.entityTypeName} with args`, {
			id,
			updateArgs,
		});

		throw new Error('Not implemented');
	}

	public async updateMany(updateItems: (Partial<T> & { id: string })[]): Promise<T[]> {
		logger.trace(`Running update many ${this.entityTypeName} with args`, {
			updateItems: updateItems,
		});

		throw new Error('Not implemented');
	}

	public async createOrUpdateMany(items: Partial<T>[]): Promise<T[]> {
		// not something we can do with REST
		return Promise.reject();
	}

	// POST METHODS
	public async createOne(createArgs: Partial<T>): Promise<T> {
		throw new Error('Not implemented');
	}

	public async createMany(createItems: Partial<T>[]): Promise<T[]> {
		logger.trace(`Running create ${this.entityTypeName} with args`, {
			createItems,
		});

		throw new Error('Not implemented');
	}

	// DELETE METHODS
	public async deleteOne(filter: unknown): Promise<boolean> {
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
