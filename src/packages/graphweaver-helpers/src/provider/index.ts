import { Filter, PaginationOptions, BackendProvider, WithId } from '@exogee/graphweaver';

export interface ProviderOptions<Entity, Context, DataEntity> {
	init?(): Promise<Context>;
	create?(context: Context, entity: Partial<Entity>): Promise<DataEntity>;
	read(
		context: Context,
		filter: Filter<Entity>,
		pagination?: Partial<PaginationOptions>
	): Promise<DataEntity | Array<DataEntity> | null>;
	update?(context: Context, id: WithId['id'], entity: Partial<Entity>): Promise<DataEntity>;
	remove?(context: Context, filter: Filter<Entity>): Promise<boolean>;
	search?(context: Context, term: string): Promise<Array<DataEntity> | null>;
	backendId: string;
	dataEntity?: () => any;
	//updateOne?(context: Context, id: WithId['id'], entity: Partial<Entity>): Promise<DataEntity>;
}

export const createProvider = <Entity extends WithId, Context, DataEntity extends WithId = any>(
	options: ProviderOptions<Entity, Context, DataEntity>
) => {
	class Provider<Entity extends WithId, Context> implements BackendProvider<DataEntity, Entity> {
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

		create: ProviderOptions<Entity, Context, DataEntity>['create'];
		read: ProviderOptions<Entity, Context, DataEntity>['read'];
		update: ProviderOptions<Entity, Context, DataEntity>['update'];
		remove: ProviderOptions<Entity, Context, DataEntity>['remove'];
		search: ProviderOptions<Entity, Context, DataEntity>['search'];
		initFn: Promise<void>;
		dataEntity?: () => any;

		context: Context | undefined;

		constructor({
			create,
			read,
			update,
			remove,
			search,
			init,
			dataEntity,
			backendId,
		}: ProviderOptions<Entity, Context, DataEntity>) {
			this.backendId = backendId;
			this.create = create;
			this.read = read;
			this.update = update;
			this.remove = remove;
			this.search = search;
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

		_mapDataEntity(dataEntity: DataEntity): DataEntity {
			console.log('_mapDataEntity ', this?.dataEntity);
			if (!this?.dataEntity || typeof this.dataEntity !== 'function') return dataEntity;
			const entity = Object.assign(new (this.dataEntity())(), dataEntity, {
				id: dataEntity.id,
			});
			return entity;
		}

		async find(
			filter: Filter<Entity>,
			pagination?: Partial<PaginationOptions>
		): Promise<Array<DataEntity>> {
			await this.initFn;

			const result = await this.read(this.context as Context, filter, pagination);

			if (result === null) return [];
			if (Array.isArray(result)) return result.map((resultItem) => this._mapDataEntity(resultItem));
			return [this._mapDataEntity(result)];
		}

		async findOne(filter: Filter<Entity>): Promise<DataEntity | null> {
			const result = (await this.find(filter, { limit: 1 }))?.[0];
			return this._mapDataEntity(result) || null;
		}

		async fullTextSearch(query: string): Promise<Array<DataEntity>> {
			await this.initFn;
			const result = await this.search(this.context as Context, query);
			if (result === null) return [];
			if (Array.isArray(result)) return result;
			return [result];
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

		async updateOne(id: Entity['id'], entity: Partial<Entity>): Promise<DataEntity> {
			await this.initFn;
			if (!this.update) {
				throw new Error('update not available');
			}
			return this.update(this.context as Context, id, entity);
		}

		async updateMany(entities: Array<Partial<Entity>>): Promise<Array<DataEntity>> {
			await this.initFn;
			if (!this.update) throw new Error('update not available');
			return Promise.all(entities.map((entity) => this.updateOne(entity.id, entity)));
		}

		async createOne(entity: Partial<Entity>): Promise<DataEntity> {
			await this.initFn;
			if (!this.create) throw new Error('create not available');
			return this.create(this.context as Context, entity);
		}

		async createMany(entities: Array<Partial<Entity>>): Promise<Array<DataEntity>> {
			await this.initFn;
			if (!this.create) throw new Error('create not available');
			return Promise.all(entities.map((entity) => this.createOne(entity)));
		}

		async createOrUpdateMany(entities: Array<Partial<Entity>>): Promise<Array<DataEntity>> {
			await this.initFn;
			if (!this.update || !this.create) throw new Error('create/update not available');
			return Promise.all(
				entities.map((entity) =>
					typeof entity.id === 'string' ? this.updateOne(entity.id, entity) : this.createOne(entity)
				)
			);
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
