import { BaseEntity, RelationshipMap, RelationshipType, Relationship } from '../entities';
import { logger } from '@exogee/logger';
import DataLoader from 'dataloader';
import { EntityConstructor, EntityManager } from '../entity-manager';

let loadOneLoaderMap: { [key: string]: DataLoader<string, any> } = {};

const REST_MAX_REQUEST_BATCH_SIZE = 100;
const REST_RESULTS_PAGE_SIZE = 900;

type LoadByRelatedIdProps<T extends BaseEntity, O extends BaseEntity> = {
	restType: EntityConstructor<T>;
	relatedRestType: EntityConstructor<O>;
	relatedField: keyof T & string;
	id: string;
};

const getAllMatchingRecords = async <T extends BaseEntity>(
	manager: EntityManager<T>,
	filter: Record<string, any>
) => {
	const results: T[] = [];

	return results;
};

const getLoadOneLoader = <T extends BaseEntity>(odataType: EntityConstructor<T>) => {
	if (!loadOneLoaderMap[odataType.name]) {
		const fetchRecordsById = async (keys: readonly string[]) => {
			logger.trace(`REST DataLoader: Loading ${odataType.name} (${keys.join(', ')})`);

			const filter = {
				$or: keys.map((k) => {
					return { [odataType.prototype._fieldMap.get('id')]: k };
				}),
			};
			const manager = new EntityManager(odataType as any);
			const records = await getAllMatchingRecords(manager, filter);

			logger.trace(`REST DataLoader: Loading ${odataType.name} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: T } = {};
			for (const record of records) {
				// TODO: as any here is really gross. Find a better way to type T.
				lookup[(record as any).id] = record as any;
			}
			return keys.map((key) => lookup[key]);
		};

		loadOneLoaderMap[odataType.name] = new DataLoader(fetchRecordsById, {
			maxBatchSize: REST_MAX_REQUEST_BATCH_SIZE,
		});
	}

	return loadOneLoaderMap[odataType.name] as DataLoader<string, T>;
};

let relatedIdLoaderMap: { [key: string]: DataLoader<string, any> } = {};

const isManyToManyRelationship = <T>(
	relationship?: Relationship<T>
): relationship is Relationship<T> & {
	type: RelationshipType.MANY_TO_MANY;
	linkEntityAttributes: {
		name: string;
	};
} => {
	return !!(
		relationship &&
		relationship.type === RelationshipType.MANY_TO_MANY &&
		relationship?.linkEntityAttributes?.name
	);
};

const constructFilter = <T>(
	keys: readonly string[],
	relatedIdField: string,
	relationship?: Relationship<T>
) => {
	const filter = {
		$or: keys.map((k) => ({ [relatedIdField]: k })),
	};

	if (isManyToManyRelationship(relationship)) {
		return {
			[relationship.linkEntityAttributes.name]: {
				__attrs: {
					...(relationship.linkEntityAttributes?.to && {
						to: relationship.linkEntityAttributes.to,
					}),
					...(relationship.linkEntityAttributes?.from && {
						from: relationship.linkEntityAttributes.from,
					}),
					select: [relatedIdField],
					alias: relationship.linkEntityAttributes.name,
				},
				...filter,
			},
		};
	}

	return filter;
};

const getRelatedRecordId = <T extends BaseEntity>(
	record: T,
	relatedIdField: string,
	relationship?: Relationship<T>
) => {
	return isManyToManyRelationship(relationship) ? null : record[relatedIdField as keyof T];
};

const getRelatedIdLoader = <T extends BaseEntity, O extends BaseEntity>(
	odataType: EntityConstructor<T>,
	relatedOdataType: EntityConstructor<O>,
	relatedIdField: string
) => {
	const loaderKey = `${odataType.name}-${relatedOdataType.name}`;
	if (!relatedIdLoaderMap[loaderKey]) {
		const fetchRecordsByRelatedId = async (keys: readonly string[]) => {
			logger.trace(
				`REST DataLoader: Loading ${odataType.name}.${relatedIdField} in (${keys.join(', ')})`
			);

			const { _relationshipMap, _aliasMap } = odataType?.prototype as EntityConstructor<T>;
			const alias = _aliasMap?.get(relatedIdField);
			const relationship = _relationshipMap?.get(alias ?? relatedIdField);

			const filter = constructFilter(keys, relatedIdField, relationship);
			const manager = new EntityManager(odataType);
			const records = await getAllMatchingRecords(manager, filter);
			logger.trace(`REST DataLoader: Loading ${odataType.name} got ${records.length} result(s).`);

			// Need to return in the same order as was requested. Iterate once and create
			// a map by ID so we don't n^2 this stuff.
			const lookup: { [key: string]: T[] } = {};
			for (const record of records) {
				const relatedRecordId = getRelatedRecordId(record, relatedIdField, relationship);
				if (!lookup[relatedRecordId]) lookup[relatedRecordId] = [];
				lookup[relatedRecordId].push(record);
			}

			return keys.map((key) => lookup[key] || []);
		};

		relatedIdLoaderMap[loaderKey] = new DataLoader(fetchRecordsByRelatedId, {
			maxBatchSize: REST_MAX_REQUEST_BATCH_SIZE,
		});
	}

	return relatedIdLoaderMap[loaderKey] as DataLoader<string, T[]>;
};

export const RestLoaders = {
	loadOne: <T extends BaseEntity>(odataType: EntityConstructor<T>, id: string) => {
		const loader = getLoadOneLoader(odataType);
		return loader.load(id) as unknown as Promise<T>;
	},

	loadByRelatedId: <T extends BaseEntity, O extends BaseEntity>({
		restType,
		relatedRestType,
		relatedField,
		id,
	}: LoadByRelatedIdProps<T, O>) => {
		const loader = getRelatedIdLoader(restType as any, relatedRestType as any, relatedField);
		return loader.load(id) as unknown as Promise<T[]>;
	},

	clearCache: () => {
		logger.trace('Clearing REST DataLoader cache');

		loadOneLoaderMap = {};
		relatedIdLoaderMap = {};
	},
};
