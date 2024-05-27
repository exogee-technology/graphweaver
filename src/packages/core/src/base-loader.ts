import { logger } from '@exogee/logger';
import DataLoader from 'dataloader';

import { Filter, graphweaverMetadata, isTransformableGraphQLEntityClass } from '.';

let loadOneLoaderMap: { [key: string]: DataLoader<string, unknown> } = {};
let relatedIdLoaderMap: { [key: string]: DataLoader<string, unknown> } = {};

const getGqlEntityName = (gqlEntityType: any) => {
	const gqlTypeName = graphweaverMetadata.nameForObjectType(gqlEntityType);
	if (!gqlTypeName) {
		throw new Error('Could not look up type name for entity.');
	}
	return gqlTypeName;
};

const getBaseLoadOneLoader = <G = unknown, D = unknown>(gqlEntityType: {
	new (...args: any[]): G;
}) => {
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

			const filter = {
				_or: keys.map((id) => ({ [primaryKeyField]: id })),
				// Note: Typecast here shouldn't be necessary, but FilterEntity<G> doesn't like this.
			} as Filter<G>;

			const backendFilter = isTransformableGraphQLEntityClass(entity.target)
				? entity.target.toBackendEntityFilter(filter)
				: (filter as Filter<D>);

			const records = await entity.provider!.find(backendFilter);

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

const getBaseRelatedIdLoader = <G = unknown, D = unknown>({
	gqlEntityType,
	relatedField,
	filter,
}: {
	gqlEntityType: { new (...args: any[]): G };
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
			if (!entity?.provider) throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);

			logger.trace(
				`DataLoader: Loading ${gqlTypeName}.${relatedField}${
					filter && `.${JSON.stringify(filter)}`
				} in (${keys.join(', ')})`
			);

			const backendFilter = isTransformableGraphQLEntityClass(entity.target)
				? entity.target.toBackendEntityFilter(filter ?? {})
				: (filter as Filter<D> | undefined);

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
			for (const record of records) {
				const relatedRecord = record[relatedField as keyof D];
				if (entity.provider.isCollection(relatedRecord)) {
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
	loadOne: <G = unknown, D = unknown>({
		gqlEntityType,
		id,
	}: {
		gqlEntityType: { new (...args: any[]): G };
		id: string;
	}) => {
		const loader = getBaseLoadOneLoader<G, D>(gqlEntityType);
		return loader.load(id);
	},

	loadByRelatedId: <G = unknown, D = unknown>(args: {
		gqlEntityType: { new (...args: any[]): G };
		relatedField: keyof D & string;
		id: string;
		filter?: Filter<G>;
	}) => {
		const loader = getBaseRelatedIdLoader<G, D>(args);
		return loader.load(args.id);
	},

	clearCache: () => {
		logger.trace('Clearing Base Loader DataLoader cache.');

		loadOneLoaderMap = {};
		relatedIdLoaderMap = {};
	},
};
