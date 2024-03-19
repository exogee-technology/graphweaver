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

const getBaseLoadOneLoader = <G extends GraphQLEntity<D>, D extends BaseDataEntity>(
	gqlEntityType: GraphQLEntityConstructor<G, D>
) => {
	const gqlTypeName = getGqlEntityName(gqlEntityType);
	if (!loadOneLoaderMap[gqlTypeName]) {
		const provider = graphweaverMetadata.getEntity<unknown, D>(gqlTypeName)?.provider;
		if (!provider) {
			throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);
		}

		const fetchRecordsById = async (keys: readonly string[]) => {
			logger.trace(
				`DataLoader: Loading ${gqlTypeName}, ${keys.length} record(s): (${keys.join(', ')})`
			);

			const records = await provider.find({
				_or: keys.map((id) => ({ id })),
			});

			logger.trace(`Loading ${gqlTypeName} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: D } = {};
			for (const record of records) {
				record.id && (lookup[record.id] = record);
			}
			return keys.map((key) => lookup[key]);
		};

		loadOneLoaderMap[gqlTypeName] = new DataLoader(fetchRecordsById, {
			maxBatchSize: provider.maxDataLoaderBatchSize,
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
		const provider = graphweaverMetadata.getEntity<unknown, D>(gqlTypeName)?.provider;
		if (!provider) throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);

		const fetchRecordsByRelatedId = async (keys: readonly string[]) => {
			logger.trace(
				`DataLoader: Loading ${gqlTypeName}.${relatedField}${
					filter && `.${JSON.stringify(filter)}`
				} in (${keys.join(', ')})`
			);

			const records = await provider.findByRelatedId(
				provider.entityType,
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
				if (provider.isCollection(relatedRecord)) {
					// ManyToManys come back this way.
					for (const subRecord of relatedRecord) {
						if (!lookup[subRecord.id]) lookup[subRecord.id] = [];
						lookup[subRecord.id].push(record as D);
					}
				} else {
					// ManyToOnes come back this way
					const relatedRecordId = provider.getRelatedEntityId(relatedRecord, relatedField);
					if (!lookup[relatedRecordId]) lookup[relatedRecordId] = [];
					lookup[relatedRecordId].push(record as D);
				}
			}

			return keys.map((key) => lookup[key] || []);
		};

		relatedIdLoaderMap[loaderKey] = new DataLoader(fetchRecordsByRelatedId, {
			maxBatchSize: provider.maxDataLoaderBatchSize,
		});
	}
	return relatedIdLoaderMap[loaderKey] as DataLoader<string, D[]>;
};

export const BaseLoaders = {
	loadOne: <G extends GraphQLEntity<D>, D extends BaseDataEntity>({
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
