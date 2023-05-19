import { Filter, PaginationOptions, BackendProvider } from '@exogee/graphweaver';

export interface ProviderOptions<Entity, Context, DataEntity> {
	init?(): Promise<Context>;
	create?(context: Context, entity: Partial<Entity>): Promise<DataEntity>;
	read(
		context: Context,
		filter: Filter<Entity>,
		pagination?: Partial<PaginationOptions>
	): Promise<DataEntity | Array<DataEntity> | null>;
	update?(context: Context, id: string, entity: Partial<Entity>): Promise<DataEntity>;
	remove?(context: Context, filter: Filter<Entity>): Promise<boolean>;
	backendId: string;
}

export const createProvider = <Entity, Context, DataEntity = Entity>(
	options: ProviderOptions<Entity, Context, DataEntity>
) => {
	class Provider<Entity, Context> implements BackendProvider<DataEntity, Entity> {
		readonly backendId: string;

		create: ProviderOptions<Entity, Context, DataEntity>['create'];
		read: ProviderOptions<Entity, Context, DataEntity>['read'];
		update: ProviderOptions<Entity, Context, DataEntity>['update'];
		remove: ProviderOptions<Entity, Context, DataEntity>['remove'];
		initFn: Promise<void>;

		context: Context | undefined;

		constructor({
			create,
			read,
			update,
			remove,
			init,
			backendId,
		}: ProviderOptions<Entity, Context, DataEntity>) {
			this.backendId = backendId;
			this.create = create;
			this.read = read;
			this.update = update;
			this.remove = remove;
			this.initFn = new Promise<void>((resolve, reject) => {
				if (!init) {
					resolve();
					return;
				}
				init().then((context) => {
					this.context = context;
					resolve();
				});
			});
		}

		init() {
			return this.initFn;
		}

		async find(
			filter: Filter<Entity>,
			pagination?: Partial<PaginationOptions>
		): Promise<Array<DataEntity>> {
			await this.initFn;
			const result = await this.read(this.context as Context, filter, pagination);
			return result === null ? [] : Array.isArray(result) ? result : [result];
		}

		async findOne(filter: Filter<Entity>): Promise<DataEntity | null> {
			const result = await this.find(filter, { limit: 1 });
			const oneResult = Array.isArray(result) ? result?.[0] : result;
			return oneResult || null;
		}

		async findByRelatedId(
			entity: any,
			relatedField: string,
			relatedIds: readonly string[],
			filter?: Filter<Entity>
		): Promise<Array<DataEntity>> {
			await this.initFn;
			throw new Error('Not implemented: findByRelatedId');
		}

		async updateOne(id: string, entity: Partial<Entity>): Promise<DataEntity> {
			await this.initFn;
			if (!this.update) throw new Error('update not available');
			return this.update(this.context as Context, id, entity);
		}

		async updateMany(entities: Array<Partial<Entity>>): Promise<Array<DataEntity>> {
			await this.initFn;
			if (!this.update) throw new Error('update not available');
			throw new Error('Not implemented: updateMany');
		}

		async createOne(entity: Partial<Entity>): Promise<DataEntity> {
			await this.initFn;
			if (!this.create) throw new Error('create not available');
			return this.create(this.context as Context, entity);
		}

		async createMany(entities: Array<Partial<Entity>>): Promise<Array<DataEntity>> {
			await this.initFn;
			if (!this.create) throw new Error('create not available');
			throw new Error('Not implemented: createMany');
		}

		async createOrUpdateMany(entities: Array<Partial<Entity>>): Promise<Array<DataEntity>> {
			await this.initFn;
			if (!this.update || !this.create) throw new Error('create/update not available');
			throw new Error('Not implemented: createOrUpdateMany');
		}

		async deleteOne(filter: Filter<Entity>): Promise<boolean> {
			await this.initFn;
			if (!this.remove) throw new Error('delete not available');
			throw new Error('Not implemented: deleteOne');
		}

		getRelatedEntityId(entity: any, relatedIdField: string): string {
			throw new Error('not implemented: getRelatedEntityId');
		}

		isCollection(entity: unknown): boolean {
			return false;
		}
	}

	return new Provider(options);
};
