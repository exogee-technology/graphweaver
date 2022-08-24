"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseLoaders = void 0;
const logger_1 = require("./logger");
const dataloader_1 = __importDefault(require("dataloader"));
const type_graphql_1 = require("type-graphql");
const _1 = require(".");
let loadOneLoaderMap = {};
let relatedIdLoaderMap = {};
const metadata = (0, type_graphql_1.getMetadataStorage)();
// @todo - cache as won't change regardless of user or request, so worth memoizing this function.
const getGqlEntityName = (gqlEntityType) => {
    const objectNames = metadata.objectTypes.filter((objectType) => objectType.target === gqlEntityType);
    if (objectNames.length === 0) {
        throw new Error('ObjectType name parameter was not set for GQL entity deriving from BaseEntity');
    }
    return objectNames[0].name;
};
// @todo - cache as won't change regardless of user or request, so worth memoizing this function.
const getFieldMetadata = (fieldName, gqlEntityType) => {
    const entityFields = metadata.fields.filter((field) => field.target === gqlEntityType && field.name === fieldName);
    if (entityFields.length !== 1) {
        throw new Error(`No match found for ${fieldName} in object ${gqlEntityType}`);
    }
    return entityFields[0];
};
const getBaseLoadOneLoader = (gqlEntityType) => {
    const gqlTypeName = getGqlEntityName(gqlEntityType);
    if (!loadOneLoaderMap[gqlTypeName]) {
        const fetchRecordsById = async (keys) => {
            var _a;
            logger_1.logger.trace(`DataLoader: Loading ${gqlTypeName} (${keys.join(', ')})`);
            const provider = (_a = _1.EntityMetadataMap.get(gqlTypeName)) === null || _a === void 0 ? void 0 : _a.provider;
            if (!provider) {
                throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);
            }
            const filter = {
                $or: keys.map((k) => {
                    return { id: k };
                }),
            };
            const records = await provider.find(filter);
            logger_1.logger.trace(`Loading ${gqlTypeName} got ${records.length} result(s).`);
            // Need to return in the same order as was requested. Iterate once and create
            // a map by ID so we don't n^2 this stuff.
            const lookup = {};
            for (const record of records) {
                lookup[record.id] = record;
            }
            return keys.map((key) => lookup[key]);
        };
        loadOneLoaderMap[gqlTypeName] = new dataloader_1.default(fetchRecordsById);
    }
    return loadOneLoaderMap[gqlTypeName];
};
const getBaseRelatedIdLoader = ({ gqlEntityType, relatedField, }) => {
    const gqlTypeName = getGqlEntityName(gqlEntityType);
    const loaderKey = `${gqlTypeName}-${relatedField}`; /* gqlTypeName-fieldname */
    if (!relatedIdLoaderMap[loaderKey]) {
        const fetchRecordsByRelatedId = async (keys) => {
            var _a;
            logger_1.logger.trace(`DataLoader: Loading ${gqlTypeName}.${relatedField} in (${keys.join(', ')})`);
            // Check metadata storage
            const provider = (_a = _1.EntityMetadataMap.get(gqlTypeName)) === null || _a === void 0 ? void 0 : _a.provider;
            if (!provider)
                throw new Error(`Unable to locate provider for type '${gqlTypeName}'`);
            // @todo Check if this is a many-to-many field - get mikroorm metadata
            //const fieldMetadata = getFieldMetadata(relatedField, gqlEntityType);
            const records = await provider.findByRelatedId(provider.entityType, relatedField, keys);
            logger_1.logger.trace(`DataLoader: Loading ${gqlTypeName} got ${records.length} result(s).`);
            // Need to return in the same order as was requested. Iterate once and create
            // a map by ID so we don't n^2 this stuff.
            const lookup = {};
            for (const record of records) {
                const relatedRecord = record[relatedField];
                if (provider.isCollection(relatedRecord)) {
                    // ManyToManys come back this way.
                    for (const subRecord of relatedRecord) {
                        if (!lookup[subRecord.id])
                            lookup[subRecord.id] = [];
                        lookup[subRecord.id].push(record);
                    }
                }
                else {
                    // ManyToOnes come back this way
                    const relatedRecordId = provider.getRelatedEntityId(relatedRecord, relatedField);
                    if (!lookup[relatedRecordId])
                        lookup[relatedRecordId] = [];
                    lookup[relatedRecordId].push(record);
                }
            }
            return keys.map((key) => lookup[key] || []);
        };
        relatedIdLoaderMap[loaderKey] = new dataloader_1.default(fetchRecordsByRelatedId);
    }
    return relatedIdLoaderMap[loaderKey];
};
exports.BaseLoaders = {
    loadOne: ({ gqlEntityType, id, }) => {
        const loader = getBaseLoadOneLoader(gqlEntityType);
        return loader.load(id);
    },
    loadByRelatedId: (args) => {
        const loader = getBaseRelatedIdLoader(args);
        return loader.load(args.id);
    },
    clearCache: () => {
        logger_1.logger.trace('Clearing ORM DataLoader cache.');
        loadOneLoaderMap = {};
        relatedIdLoaderMap = {};
    },
};
