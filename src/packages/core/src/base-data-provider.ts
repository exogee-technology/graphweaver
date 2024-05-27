import { BackendProvider, BackendProviderConfig, Filter, PaginationOptions } from './types';

export class BaseDataProvider<D> implements BackendProvider<D> {
	constructor(readonly backendId: string) {
		if (!backendId) throw new Error('BackendId must be defined');
	}

	backendProviderConfig?: BackendProviderConfig;

	// READ METHODS
	public async find(
		filter: Filter<D>,
		pagination?: PaginationOptions,
		additionalOptionsForBackend?: any
	): Promise<D[]> {
		throw new Error('Find not implemented.');
	}

	public async findOne(filter: Filter<D>): Promise<D | null> {
		throw new Error('FindOne not implemented.');
	}
	public async findByRelatedId(
		entity: any,
		relatedField: string,
		relatedIds: readonly string[],
		filter?: Filter<D>
	): Promise<D[]> {
		throw new Error('FindByRelatedId not implemented.');
	}

	// UPDATE METHODS
	public async updateOne(
		id: string | number,
		updateArgs: Partial<D & { version?: number }>
	): Promise<D> {
		throw new Error('UpdateOne not implemented');
	}

	public async updateMany(updateItems: Partial<D>[]): Promise<D[]> {
		throw new Error('UpdateMany not implemented');
	}

	public async createOrUpdateMany(items: Partial<D>[]): Promise<D[]> {
		throw new Error('CreateOrUpdateMany not implemented');
	}

	// CREATE METHODS
	public async createOne(createArgs: Partial<D>): Promise<D> {
		throw new Error('CreateOne not implemented');
	}

	public async createMany(createItems: Partial<D>[]): Promise<D[]> {
		throw new Error('CreateMany not implemented');
	}

	// DELETE METHODS
	public async deleteOne(filter: Filter<D>): Promise<boolean> {
		throw new Error('DeleteOne Not implemented');
	}

	public async deleteMany(filter: Filter<D>): Promise<boolean> {
		throw new Error('DeleteMany Not implemented');
	}

	// HELPER METHODS
	getRelatedEntityId(entity: any, relatedIdField: string): string {
		throw new Error('GetRelatedEntityId not implemented');
	}

	isCollection(entity: unknown): entity is Iterable<D> {
		throw new Error('IsCollection not implemented');
	}
}
