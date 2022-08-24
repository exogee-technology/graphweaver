import { logger } from './logger';
import DataLoader from 'dataloader';
import { getMetadataStorage } from 'type-graphql';

import { EntityMetadataMap } from '.';
import { GraphQLEntityConstructor } from './base-entity';

let loadOneLoaderMap: { [key: string]: DataLoader<string, any> } = {};
let relatedIdLoaderMap: { [key: string]: DataLoader<string, any> } = {};

const metadata = getMetadataStorage();

// @todo - cache as won't change regardless of user or request, so worth memoizing this function.
const getGqlEntityName = (gqlEntityType: any) => {
	const objectNames = metadata.objectTypes.filter(
		(objectType) => objectType.target === gqlEntityType
	);

	if (objectNames.length === 0) {
		throw new Error(
			'ObjectType name parameter was not set for GQL entity deriving from BaseEntity'
		);
	}

	return objectNames[0].name;
};

// @todo - cache as won't change regardless of user or request, so worth memoizing this function.
const getFieldMetadata = (fieldName: string, gqlEntityType: any) => {
	const entityFields = metadata.fields.filter(
		(field) => field.target === gqlEntityType && field.name === fieldName
	);
	if (entityFields.length !== 1) {
		throw new Error(`No match found for ${fieldName} in object ${gqlEntityType}`);
	}

	return entityFields[0];
};

const getBaseLoadOneLoader = <T>(gqlEntityType: GraphQLEntityConstructor<T>) => {
	const gqlTypeName = getGqlEntityName(gqlEntityType);
	if (!loadOneLoaderMap[gqlTypeName]) {
		const fetchRecordsById = async (keys: readonly string[]) => {
			logger.trace(`DataLoader: Loading ${gqlTypeName} (${keys.join(', ')})`);

			const provider = EntityMetadataMap.get(gqlTypeName)?.provider;
			if (!provider) {
				throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);
			}

			const filter = {
				$or: keys.map((k) => {
					return { id: k };
				}),
			};

			const records = await provider.find(filter);

			logger.trace(`Loading ${gqlTypeName} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: T } = {};
			for (const record of records) {
				lookup[record.id] = record;
			}
			return keys.map((key) => lookup[key]);
		};

		loadOneLoaderMap[gqlTypeName] = new DataLoader(fetchRecordsById);
	}

	return loadOneLoaderMap[gqlTypeName] as DataLoader<string, T>;
};

const getBaseRelatedIdLoader = <T>({
	gqlEntityType,
	relatedField,
}: {
	gqlEntityType: GraphQLEntityConstructor<T>;
	relatedField: string;
}) => {
	const gqlTypeName = getGqlEntityName(gqlEntityType);
	const loaderKey = `${gqlTypeName}-${relatedField}`; /* gqlTypeName-fieldname */
	if (!relatedIdLoaderMap[loaderKey]) {
		const fetchRecordsByRelatedId = async (keys: readonly string[]) => {
			logger.trace(`DataLoader: Loading ${gqlTypeName}.${relatedField} in (${keys.join(', ')})`);

			// Check metadata storage

			const provider = EntityMetadataMap.get(gqlTypeName)?.provider;
			if (!provider) throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);

			// @todo Check if this is a many-to-many field - get mikroorm metadata
			//const fieldMetadata = getFieldMetadata(relatedField, gqlEntityType);

			const records = await provider.findByRelatedId(provider.entityType, relatedField, keys);
			logger.trace(`DataLoader: Loading ${gqlTypeName} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: T[] } = {};
			for (const record of records) {
				const relatedRecord = record[relatedField];
				if (provider.isCollection(relatedRecord)) {
					// ManyToManys come back this way.
					for (const subRecord of relatedRecord) {
						if (!lookup[subRecord.id]) lookup[subRecord.id] = [];
						lookup[subRecord.id].push(record as T);
					}
				} else {
					// ManyToOnes come back this way
					const relatedRecordId = provider.getRelatedEntityId(relatedRecord, relatedField);
					if (!lookup[relatedRecordId]) lookup[relatedRecordId] = [];
					lookup[relatedRecordId].push(record as T);
				}
			}

			return keys.map((key) => lookup[key] || []);
		};

		relatedIdLoaderMap[loaderKey] = new DataLoader(fetchRecordsByRelatedId);
	}

	return relatedIdLoaderMap[loaderKey] as DataLoader<string, T[]>;
};

export const BaseLoaders = {
	loadOne: <T>({
		gqlEntityType,
		id,
	}: {
		gqlEntityType: GraphQLEntityConstructor<T>;
		id: string;
	}) => {
		const loader = getBaseLoadOneLoader(gqlEntityType);
		return (loader.load(id) as unknown) as Promise<T>;
	},

	loadByRelatedId: <T>(args: {
		gqlEntityType: GraphQLEntityConstructor<T>;
		relatedField: keyof T & string;
		id: string;
	}) => {
		const loader = getBaseRelatedIdLoader(args);
		return (loader.load(args.id) as unknown) as Promise<T[]>;
	},

	clearCache: () => {
		logger.trace('Clearing ORM DataLoader cache.');

		loadOneLoaderMap = {};
		relatedIdLoaderMap = {};
	},
};