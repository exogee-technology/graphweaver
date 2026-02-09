import { logger } from '@exogee/logger';
import DataLoader from 'dataloader';

import {
	EntityMetadata,
	Filter,
	getFieldTypeWithMetadata,
	graphweaverMetadata,
	isEntityMetadata,
	isGraphQLScalarForTypeScriptType,
	isTransformableGraphQLEntityClass,
} from '.';
import { RequestContext } from './request-context';
import { GraphweaverRequestEvent } from './types';

import type { GraphweaverPlugin, GraphweaverPluginNextFunction } from './types';
import { cleanFilter } from './utils';

type LoaderMap = { [key: string]: DataLoader<string, unknown> };

type LoadOneOptions<G = unknown> = {
	gqlEntityType: { new (...args: any[]): G };
	id: string;
	filter?: Filter<G>;
};

type LoadByRelatedIdOptions<G = unknown, D = unknown> = {
	gqlEntityType: { new (...args: any[]): G };
	relatedField: keyof D & string;
	id: string;
	filter?: Filter<G>;
};

const getGqlEntityName = (gqlEntityType: any) => {
	const gqlTypeName = graphweaverMetadata.nameForObjectType(gqlEntityType);
	if (!gqlTypeName) {
		throw new Error('Could not look up type name for entity.');
	}
	return gqlTypeName;
};

const getBaseLoadOneLoader = <G = unknown, D = unknown>({
	gqlEntityType,
	filter,
	keyStore,
}: {
	gqlEntityType: {
		new (...args: any[]): G;
	};
	keyStore: LoaderMap;
	filter?: Filter<G>;
}) => {
	const gqlTypeName = getGqlEntityName(gqlEntityType);
	const loaderKey = `${gqlTypeName}-${JSON.stringify(filter)}`;
	if (!keyStore[loaderKey]) {
		const entity = graphweaverMetadata.getEntityByName<G, D>(gqlTypeName);
		if (!entity?.provider) {
			throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);
		}

		const fetchRecordsById = async (keys: readonly string[]) => {
			logger.trace({ keys }, `DataLoader: Loading ${gqlTypeName}, ${keys.length} record(s)`);
			const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity) as keyof D;

			let listFilter = {
				[`${String(primaryKeyField)}_in`]: keys,
				// Note: Typecast here shouldn't be necessary, but FilterEntity<G> doesn't like this.
			} as Filter<G>;

			if (filter) {
				listFilter = {
					_and: [listFilter, filter],
				} as Filter<G>;
			}

			let backendFilter: Filter<D> | undefined =
				isTransformableGraphQLEntityClass(entity.target) && entity.target.toBackendEntityFilter
					? entity.target.toBackendEntityFilter(listFilter)
					: (listFilter as Filter<D>);

			backendFilter = cleanFilter(backendFilter);

			let records: D[];
			if (entity.provider?.backendProviderConfig?.idListLoadingMethod !== 'findOne') {
				records = await entity.provider!.find(
					backendFilter ?? {},
					undefined,
					entity as EntityMetadata
				);
			} else {
				records = (
					await Promise.all(
						keys.map((key) =>
							entity.provider!.findOne(
								{ [primaryKeyField]: key } as Filter<D>,
								entity as EntityMetadata
							)
						)
					)
				).filter((row) => row) as D[];
			}

			logger.trace(`Loading ${gqlTypeName} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: D } = {};
			for (const record of records) {
				const primaryKeyValue = record[primaryKeyField];
				if (
					typeof primaryKeyValue === 'number' ||
					typeof primaryKeyValue === 'string' ||
					typeof primaryKeyValue === 'bigint'
				) {
					lookup[String(record[primaryKeyField])] = record;
				} else {
					logger.warn(
						`Ignoring primary key value ${primaryKeyValue} because it is not a string, number, or bigint.`
					);
				}
			}
			return keys.map((key) => lookup[key]);
		};

		keyStore[loaderKey] = new DataLoader(fetchRecordsById, {
			maxBatchSize: entity.provider.maxDataLoaderBatchSize,
		});
	}

	return keyStore[loaderKey] as DataLoader<string, D>;
};

export const getBaseRelatedIdLoader = <G = unknown, D = unknown>({
	gqlEntityType,
	relatedField,
	keyStore,
	filter,
}: {
	gqlEntityType: { new (...args: any[]): G };
	relatedField: string;
	keyStore: LoaderMap;
	filter?: Filter<G>;
}) => {
	const gqlTypeName = getGqlEntityName(gqlEntityType);
	const loaderKey = `${gqlTypeName}-${relatedField}-${JSON.stringify(
		filter
	)}`; /* gqlTypeName-fieldname-filterObject */

	if (!keyStore[loaderKey]) {
		const entity = graphweaverMetadata.getEntityByName<G, D>(gqlTypeName);
		if (!entity?.provider) throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);
		const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity) as keyof D;

		const fetchRecordsByRelatedId = async (keys: readonly string[]) => {
			if (!entity?.provider) throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);

			logger.trace(
				`DataLoader: Loading ${gqlTypeName}.${relatedField}${
					filter && `.${JSON.stringify(filter)}`
				} in (${keys.join(', ')})`
			);

			let backendFilter =
				isTransformableGraphQLEntityClass(entity.target) && entity.target.toBackendEntityFilter
					? entity.target.toBackendEntityFilter(filter ?? {})
					: (filter as Filter<D> | undefined);

			backendFilter = cleanFilter(backendFilter);

			if (!entity.provider.entityType)
				throw new Error('EntityType is required on provider at this stage.');

			const records = await entity.provider!.findByRelatedId(
				entity.provider.entityType,
				relatedField,
				keys,
				backendFilter
			);

			logger.trace(`DataLoader: Loading ${gqlTypeName} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: D[] } = {};
			const fieldMetadata = entity.fields[relatedField];
			const {
				isList,
				fieldType,
				metadata: fieldTypeMetadata,
			} = getFieldTypeWithMetadata(fieldMetadata.getType);

			for (const record of records) {
				if (isEntityMetadata(fieldTypeMetadata)) {
					const relatedRecord = record[relatedField as keyof D];
					if (isList) {
						// ManyToManys come back this way.
						for (const subRecord of relatedRecord as Iterable<D>) {
							const stringPrimaryKey = String(
								subRecord[
									(fieldTypeMetadata.primaryKeyField ?? 'id') as keyof D
								]
							);
							if (!lookup[stringPrimaryKey]) lookup[stringPrimaryKey] = [];
							lookup[stringPrimaryKey].push(record);
						}
					} else {
						// ManyToOnes come back this way
						const relatedRecordId = String(
							relatedRecord[
								(fieldTypeMetadata.primaryKeyField ?? 'id') as keyof typeof relatedRecord
							]
						);
						if (!lookup[relatedRecordId]) lookup[relatedRecordId] = [];
						lookup[relatedRecordId].push(record);
					}
				} else if (isGraphQLScalarForTypeScriptType(fieldType)) {
					// Ok, in this case we just need to make a lookup for the field we know they gave us.
					const foreignKey = String(record[relatedField as keyof D]);
					if (!lookup[foreignKey]) lookup[foreignKey] = [];
					lookup[foreignKey].push(record);
				}
			}

			return keys.map((key) => lookup[key] || []);
		};

		keyStore[loaderKey] = new DataLoader(fetchRecordsByRelatedId, {
			maxBatchSize: entity.provider.maxDataLoaderBatchSize,
		});
	}
	return keyStore[loaderKey] as DataLoader<string, D[]>;
};

export class BaseLoader {
	private loadOneLoaderMap: LoaderMap = {};
	private relatedIdLoaderMap: LoaderMap = {};

	public loadOne<G = unknown, D = unknown>(args: LoadOneOptions<G>) {
		const loader = getBaseLoadOneLoader<G, D>({ ...args, keyStore: this.loadOneLoaderMap });
		return loader.load(args.id);
	}

	public loadByRelatedId<G = unknown, D = unknown>(args: LoadByRelatedIdOptions<G, D>) {
		const loader = getBaseRelatedIdLoader<G, D>({
			...args,
			keyStore: this.relatedIdLoaderMap,
		});
		return loader.load(args.id);
	}

	public clearCache() {
		logger.trace('Clearing Base Loader DataLoader cache.');

		this.loadOneLoaderMap = {};
		this.relatedIdLoaderMap = {};
	}
}

export const BaseLoaders = {
	loadOne: <G = unknown, D = unknown>(options: LoadOneOptions<G>) => {
		const baseLoader = RequestContext.getBaseLoader();

		if (!baseLoader) {
			throw new Error('BaseLoader not found in RequestContext');
		}

		return baseLoader.loadOne<G, D>(options);
	},
	loadByRelatedId: <G = unknown, D = unknown>(options: LoadByRelatedIdOptions<G, D>) => {
		const baseLoader = RequestContext.getBaseLoader();

		if (!baseLoader) {
			throw new Error('BaseLoader not found in RequestContext');
		}

		return baseLoader.loadByRelatedId(options);
	},
	clearCache: () => {
		const baseLoader = RequestContext.getBaseLoader();

		if (!baseLoader) {
			throw new Error('BaseLoader not found in RequestContext');
		}

		baseLoader.clearCache();
	},
};

export const BaseLoaderRequestContextPlugin: GraphweaverPlugin = {
	name: 'BaseLoaderRequestContextPlugin',
	event: GraphweaverRequestEvent.OnRequest,
	next: (_: GraphweaverRequestEvent, _next: GraphweaverPluginNextFunction) => {
		logger.trace(`Graphweaver OnRequest BaseLoaderRequestContextPlugin called.`);
		return RequestContext.create(_next);
	},
};
