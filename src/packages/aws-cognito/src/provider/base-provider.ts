import { Filter, PaginationOptions, BackendProvider } from '@exogee/graphweaver';

export interface WithId {
	id: string;
}

export interface ProviderOptions<Context, D> {
	init?(): Promise<Context>;
	create?(context: Context, entity: Partial<D>): Promise<D>;
	read(
		context: Context,
		filter: Filter<D>,
		pagination?: Partial<PaginationOptions>
	): Promise<D | D[]>;
	update?(context: Context, id: string, entity: Partial<D>): Promise<D>;
	remove?(context: Context, filter: Filter<D>): Promise<boolean>;
	search?(context: Context, term: string): Promise<D[]>;
	backendId: string;
	dataEntity?: () => { new (...args: any[]): D };
}

export const createProvider = <Context, D extends WithId>(options: ProviderOptions<Context, D>) => {
	class Provider<G, Context> implements BackendProvider<D> {
		readonly backendId: string;

		// @todo configurable
		readonly backendProviderConfig = {
			filter: {
				root: true,
				parentByChild: true,
				childByChild: true,
			},
			pagination: {
				root: true,
				offset: true,
				limit: true,
			},
			orderBy: {
				root: true,
			},
			sort: {
				root: true,
			},
		};

		create: ProviderOptions<Context, D>['create'];
		read: ProviderOptions<Context, D>['read'];
		update: ProviderOptions<Context, D>['update'];
		remove: ProviderOptions<Context, D>['remove'];
		initFn: Promise<void>;
		dataEntity?: () => any;

		context: Context | undefined;

		constructor({
			create,
			read,
			update,
			remove,
			init,
			dataEntity,
			backendId,
		}: ProviderOptions<Context, D>) {
			this.backendId = backendId;
			this.create = create;
			this.read = read;
			this.update = update;
			this.remove = remove;
			this.dataEntity = dataEntity;

			this.initFn = new Promise<void>((resolve) => {
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

		_mapDataEntity(dataEntity: D): D {
			if (!this?.dataEntity || typeof this.dataEntity !== 'function') return dataEntity;
			const entity = Object.assign(new (this.dataEntity())(), dataEntity, {
				id: dataEntity.id,
			});
			return entity;
		}

		async find(filter: Filter<D>, pagination?: Partial<PaginationOptions>): Promise<D[]> {
			await this.initFn;

			const result = await this.read(this.context as Context, filter, pagination);

			if (result === null) return [];
			if (Array.isArray(result)) return result.map((resultItem) => this._mapDataEntity(resultItem));
			return [this._mapDataEntity(result)];
		}

		async findOne(filter: Filter<D>): Promise<D | null> {
			const result = (await this.find(filter, { limit: 1 }))[0];
			return this._mapDataEntity(result) || null;
		}

		async findByRelatedId(
			entity: any,
			relatedField: string,
			relatedIds: readonly string[],
			filter?: Filter<D>
		): Promise<D[]> {
			await this.initFn;
			throw new Error('Not implemented: findByRelatedId');
		}

		async updateOne(id: string, entity: Partial<D>): Promise<D> {
			await this.initFn;
			if (!this.update) {
				throw new Error('update not available');
			}
			return this.update(this.context as Context, id, entity);
		}

		async updateMany(entities: Partial<D>[]): Promise<D[]> {
			await this.initFn;
			if (!this.update) throw new Error('update not available');
			return Promise.all(
				entities.map((entity) => {
					if (!entity.id) throw new Error('updateMany requires id');
					return this.updateOne(entity.id, entity);
				})
			);
		}

		async createOne(entity: Partial<D>): Promise<D> {
			await this.initFn;
			if (!this.create) throw new Error('create not available');
			return this.create(this.context as Context, entity);
		}

		async createMany(entities: Partial<D>[]): Promise<D[]> {
			await this.initFn;
			if (!this.create) throw new Error('create not available');
			return Promise.all(entities.map((entity) => this.createOne(entity)));
		}

		async createOrUpdateMany(entities: Partial<D>[]): Promise<D[]> {
			await this.initFn;
			if (!this.update || !this.create) throw new Error('create/update not available');
			return Promise.all(
				entities.map((entity) =>
					typeof entity.id === 'string' ? this.updateOne(entity.id, entity) : this.createOne(entity)
				)
			);
		}

		async deleteOne(filter: Filter<D>): Promise<boolean> {
			throw new Error('Not implemented: deleteOne');
		}
	}

	return new Provider(options);
};
