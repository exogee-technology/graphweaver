import { logger } from '@exogee/logger';
import DataLoader from 'dataloader';

import { BaseDataEntity, Filter, GraphQLEntity, graphweaverMetadata } from '.';
import { GraphQLEntityConstructor } from './base-entity';

let loadOneLoaderMap: { [key: string]: DataLoader<string, unknown> } = {};
let relatedIdLoaderMap: { [key: string]: DataLoader<string, unknown> } = {};

const getGqlEntityName = (gqlEntityType: any) => {
	const gqlTypeName = graphweaverMetadata.nameForObjectType(gqlEntityType);
	if (!gqlTypeName) {
		throw new Error('Could not look up type name for entity.');
	}
	return gqlTypeName;
};

const getBaseLoadOneLoader = <
	G extends GraphQLEntity<D> & { name: string },
	D extends BaseDataEntity,
>(
	gqlEntityType: GraphQLEntityConstructor<G, D>
) => {
	const gqlTypeName = getGqlEntityName(gqlEntityType);
	if (!loadOneLoaderMap[gqlTypeName]) {
		const entity = graphweaverMetadata.getEntityByName<G, D>(gqlTypeName);
		if (!entity?.provider) {
			throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);
		}

		const fetchRecordsById = async (keys: readonly string[]) => {
			logger.trace(
				`DataLoader: Loading ${gqlTypeName}, ${keys.length} record(s): (${keys.join(', ')})`
			);
			const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity) as keyof D;

			const records = await entity.provider!.find({
				_or: keys.map((id) => ({ [primaryKeyField]: id })),
				// Note: Typecast here shouldn't be necessary, but FilterEntity<G> doesn't like this.
			} as Filter<G>);

			logger.trace(`Loading ${gqlTypeName} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: D } = {};
			for (const record of records) {
				const primaryKeyValue = record[primaryKeyField];
				if (typeof primaryKeyValue === 'number' || typeof primaryKeyValue === 'string') {
					lookup[String(record[primaryKeyField])] = record;
				} else {
					logger.warn(
						`Ignoring primary key value ${primaryKeyValue} because it is not a string or number.`
					);
				}
			}
			return keys.map((key) => lookup[key]);
		};

		loadOneLoaderMap[gqlTypeName] = new DataLoader(fetchRecordsById, {
			maxBatchSize: entity.provider.maxDataLoaderBatchSize,
		});
	}

	return loadOneLoaderMap[gqlTypeName] as DataLoader<string, D>;
};

const getBaseRelatedIdLoader = <G extends GraphQLEntity<D>, D extends BaseDataEntity>({
	gqlEntityType,
	relatedField,
	filter,
}: {
	gqlEntityType: GraphQLEntityConstructor<G, D>;
	relatedField: string;
	filter?: Filter<G>;
}) => {
	const gqlTypeName = getGqlEntityName(gqlEntityType);
	const loaderKey = `${gqlTypeName}-${relatedField}-${JSON.stringify(
		filter
	)}`; /* gqlTypeName-fieldname-filterObject */

	if (!relatedIdLoaderMap[loaderKey]) {
		const entity = graphweaverMetadata.getEntityByName<G, D>(gqlTypeName);
		if (!entity?.provider) throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);
		const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity) as keyof D;

		const fetchRecordsByRelatedId = async (keys: readonly string[]) => {
			logger.trace(
				`DataLoader: Loading ${gqlTypeName}.${relatedField}${
					filter && `.${JSON.stringify(filter)}`
				} in (${keys.join(', ')})`
			);

			const records = await entity.provider!.findByRelatedId(
				entity.provider!.entityType,
				relatedField,
				keys,
				filter
			);
			logger.trace(`DataLoader: Loading ${gqlTypeName} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: D[] } = {};
			for (const record of records) {
				const relatedRecord = record[relatedField as keyof D];
				if (entity.provider!.isCollection(relatedRecord)) {
					// ManyToManys come back this way.
					for (const subRecord of relatedRecord as Iterable<D>) {
						const stringPrimaryKey = String(subRecord[primaryKeyField]);
						if (!lookup[stringPrimaryKey]) lookup[stringPrimaryKey] = [];
						lookup[stringPrimaryKey].push(record);
					}
				} else {
					// ManyToOnes come back this way
					const relatedRecordId = entity.provider!.getRelatedEntityId(relatedRecord, relatedField);
					if (!lookup[relatedRecordId]) lookup[relatedRecordId] = [];
					lookup[relatedRecordId].push(record);
				}
			}

			return keys.map((key) => lookup[key] || []);
		};

		relatedIdLoaderMap[loaderKey] = new DataLoader(fetchRecordsByRelatedId, {
			maxBatchSize: entity.provider.maxDataLoaderBatchSize,
		});
	}
	return relatedIdLoaderMap[loaderKey] as DataLoader<string, D[]>;
};

export const BaseLoaders = {
	loadOne: <G extends GraphQLEntity<D> & { name: string }, D extends BaseDataEntity>({
		gqlEntityType,
		id,
	}: {
		gqlEntityType: GraphQLEntityConstructor<G, D>;
		id: string;
	}) => {
		const loader = getBaseLoadOneLoader(gqlEntityType);
		return loader.load(id);
	},

	loadByRelatedId: <G extends GraphQLEntity<D>, D extends BaseDataEntity>(args: {
		gqlEntityType: GraphQLEntityConstructor<G, D>;
		relatedField: Omit<keyof D, 'isCollection' | 'isReference'> & string;
		id: string;
		filter?: Filter<G>;
	}) => {
		const loader = getBaseRelatedIdLoader(args);
		return loader.load(args.id);
	},

	clearCache: () => {
		logger.trace('Clearing Base Loader DataLoader cache.');

		loadOneLoaderMap = {};
		relatedIdLoaderMap = {};
	},
};
