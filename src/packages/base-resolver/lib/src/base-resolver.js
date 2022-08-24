"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseResolver = exports.registerScalarType = exports.EntityMetadataMap = void 0;
const logger_1 = require("./logger");
const pluralize_1 = __importDefault(require("pluralize"));
const type_graphql_1 = require("type-graphql");
const _1 = require(".");
const types_1 = require("./common/types");
const decorators_1 = require("./decorators");
const query_manager_1 = require("./query-manager");
const arrayOperations = new Set(['in', 'nin']);
const supportedOrderByTypes = new Set(['String', 'Number', 'Date', 'ISOString']);
const cachedTypeNames = {};
const scalarTypes = new Map();
exports.EntityMetadataMap = new Map();
function registerScalarType(scalarType, treatAsType) {
    scalarTypes.set(scalarType, treatAsType);
}
exports.registerScalarType = registerScalarType;
function createBaseResolver(gqlEntityType, provider) {
    var ListInputFilterArgs_1, FilterInputArgs_1;
    const metadata = (0, type_graphql_1.getMetadataStorage)();
    const objectNames = metadata.objectTypes.filter((objectType) => objectType.target === gqlEntityType);
    if (objectNames.length !== 1) {
        throw new Error('ObjectType name parameter was not set for GQL entity deriving from BaseEntity');
    }
    const gqlEntityTypeName = objectNames[0].name;
    const plural = (0, pluralize_1.default)(gqlEntityTypeName);
    const entityFields = metadata.fields.filter((field) => field.target === gqlEntityType);
    const enumSet = new Set(metadata.enums.map((enumMetadata) => enumMetadata.enumObj));
    let acl = _1.AclMap.get(gqlEntityType.name);
    if (!acl) {
        logger_1.logger.warn(`Could not find ACL for ${gqlEntityType.name} - only administrative users will be able to access this entity`);
        acl = {};
    }
    exports.EntityMetadataMap.set(objectNames[0].name, {
        provider,
        entity: objectNames[0],
        fields: entityFields,
        enums: metadata.enums,
        accessControlList: acl,
    });
    const determineTypeName = (inputType) => {
        var _a, _b;
        if (cachedTypeNames[inputType])
            return cachedTypeNames[inputType];
        const typeNamesFromMetadata = metadata.objectTypes.filter((objectType) => objectType.target === inputType);
        const result = (_b = (_a = typeNamesFromMetadata === null || typeNamesFromMetadata === void 0 ? void 0 : typeNamesFromMetadata[0]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : inputType.name;
        cachedTypeNames[inputType] = result;
        return result;
    };
    // Create List Filter Args:
    let ListInputFilterArgs = ListInputFilterArgs_1 = class ListInputFilterArgs {
    };
    __decorate([
        (0, type_graphql_1.Field)(() => [ListInputFilterArgs_1], { nullable: true }),
        __metadata("design:type", Array)
    ], ListInputFilterArgs.prototype, "_and", void 0);
    __decorate([
        (0, type_graphql_1.Field)(() => [ListInputFilterArgs_1], { nullable: true }),
        __metadata("design:type", Array)
    ], ListInputFilterArgs.prototype, "_or", void 0);
    __decorate([
        (0, type_graphql_1.Field)(() => ListInputFilterArgs_1, { nullable: true }),
        __metadata("design:type", ListInputFilterArgs)
    ], ListInputFilterArgs.prototype, "_not", void 0);
    ListInputFilterArgs = ListInputFilterArgs_1 = __decorate([
        (0, type_graphql_1.InputType)(`${plural}ListFilter`)
    ], ListInputFilterArgs);
    types_1.TypeMap[`${plural}ListFilter`] = ListInputFilterArgs;
    for (const field of entityFields) {
        // We can explicitly exclude a field from filtering with a decorator.
        if ((0, decorators_1.isExcludedFromInputTypes)(field.target, field.name) ||
            (0, decorators_1.isExcludedFromFilterType)(field.target, field.name)) {
            continue;
        }
        const fieldCopy = Object.assign({}, field);
        fieldCopy.target = ListInputFilterArgs;
        fieldCopy.typeOptions = { nullable: true };
        // We need to translate from entity fields, e.g. a course => subject needs to actually become
        // course list filter input => subject list filter input.
        //
        // Do this lazily to ensure we handle circular references.
        fieldCopy.getType = () => {
            // Look for an associated ListFilter class, or if it doesn't exist just pass the
            // original type, as we can also setup input args as the entities themselves.
            const typeName = determineTypeName(field.getType());
            // If it doesn't have a name it might be an enum or similar.
            return typeName
                ? types_1.TypeMap[`${(0, pluralize_1.default)(typeName)}ListFilter`] || field.getType()
                : field.getType();
        };
        metadata.collectClassFieldMetadata(fieldCopy);
        // There are extra operations for certain types. We also allow
        // users to specify an alias type in case they want a scalar of theirs
        // to get treated as a certain type.
        const fieldType = scalarTypes.has(field.getType())
            ? scalarTypes.get(field.getType())
            : field.getType();
        const metadataForField = (operation) => ({
            name: `${field.name}_${operation}`,
            schemaName: `${field.name}_${operation}`,
            description: undefined,
            target: ListInputFilterArgs,
            getType: () => fieldType,
            typeOptions: {
                nullable: true,
                array: arrayOperations.has(operation),
                arrayDepth: arrayOperations.has(operation) ? 1 : undefined,
            },
            deprecationReason: undefined,
            complexity: 1,
        });
        if (fieldType === type_graphql_1.ID || enumSet.has(fieldType)) {
            ['ne', 'in', 'nin', 'notnull', 'null'].forEach((operation) => metadata.collectClassFieldMetadata(metadataForField(operation)));
        }
        else if (fieldType === String) {
            ['ne', 'in', 'nin', 'like', 'ilike', 'notnull', 'null'].forEach((operation) => metadata.collectClassFieldMetadata(metadataForField(operation)));
        }
        else if (fieldType === Number ||
            fieldType === Date ||
            (fieldType === null || fieldType === void 0 ? void 0 : fieldType['name']) === 'ISOString') {
            // @todo: Add support for other scalar types (i.e 'ISOString') there is a circular dependency issue at present
            ['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'notnull', 'null'].forEach((operation) => metadata.collectClassFieldMetadata(metadataForField(operation)));
        }
    }
    let FilterInputArgs = FilterInputArgs_1 = class FilterInputArgs {
    };
    __decorate([
        (0, type_graphql_1.Field)(() => FilterInputArgs_1, { nullable: true }),
        __metadata("design:type", Object)
    ], FilterInputArgs.prototype, "filter", void 0);
    FilterInputArgs = FilterInputArgs_1 = __decorate([
        (0, type_graphql_1.InputType)(`${plural}FilterInput`)
    ], FilterInputArgs);
    types_1.TypeMap[`${plural}FilterInput`] = FilterInputArgs;
    for (const field of entityFields) {
        // We can explicitly exclude a field from filtering with a decorator.
        if ((0, decorators_1.isExcludedFromInputTypes)(field.target, field.name) ||
            (0, decorators_1.isExcludedFromFilterType)(field.target, field.name)) {
            continue;
        }
        const fieldCopy = Object.assign({}, field);
        fieldCopy.target = FilterInputArgs;
        fieldCopy.typeOptions = { nullable: true };
        // We need to translate from entity fields, e.g. a course => subject needs to actually become
        // course list filter input => subject list filter input.
        //
        // Do this lazily to ensure we handle circular references.
        fieldCopy.getType = () => {
            // Look for an associated FilterInput class, or if it doesn't exist just pass the
            // original type, as we can also setup input args as the entities themselves.
            const typeName = determineTypeName(field.getType());
            // If it doesn't have a name it might be an enum or similar.
            return typeName
                ? types_1.TypeMap[`${(0, pluralize_1.default)(typeName)}FilterInput`] || field.getType()
                : field.getType();
        };
        metadata.collectClassFieldMetadata(fieldCopy);
        // There are extra operations for certain types. We also allow
        // users to specify an alias type in case they want a scalar of theirs
        // to get treated as a certain type.
        const fieldType = scalarTypes.has(field.getType())
            ? scalarTypes.get(field.getType())
            : field.getType();
        const metadataForField = (operation) => ({
            name: `${field.name}_${operation}`,
            schemaName: `${field.name}_${operation}`,
            description: undefined,
            target: FilterInputArgs,
            getType: () => fieldType,
            typeOptions: {
                nullable: true,
                array: arrayOperations.has(operation),
                arrayDepth: arrayOperations.has(operation) ? 1 : undefined,
            },
            deprecationReason: undefined,
            complexity: 1,
        });
        if (fieldType === type_graphql_1.ID || enumSet.has(fieldType)) {
            ['ne', 'in', 'nin', 'notnull', 'null'].forEach((operation) => metadata.collectClassFieldMetadata(metadataForField(operation)));
        }
        else if (fieldType === String) {
            ['ne', 'in', 'nin', 'like', 'ilike', 'notnull', 'null'].forEach((operation) => metadata.collectClassFieldMetadata(metadataForField(operation)));
        }
        else if (fieldType === Number ||
            fieldType === Date ||
            (fieldType === null || fieldType === void 0 ? void 0 : fieldType['name']) === 'ISOString') {
            ['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'notnull', 'null'].forEach((operation) => metadata.collectClassFieldMetadata(metadataForField(operation)));
        }
    }
    // Create Pagination Input Types;
    let OrderByInputArgs = class OrderByInputArgs {
    };
    OrderByInputArgs = __decorate([
        (0, type_graphql_1.InputType)(`${plural}OrderByInput`)
    ], OrderByInputArgs);
    let PaginationInputArgs = class PaginationInputArgs {
    };
    __decorate([
        (0, type_graphql_1.Field)(() => type_graphql_1.Int, { nullable: true }),
        __metadata("design:type", Number)
    ], PaginationInputArgs.prototype, "limit", void 0);
    __decorate([
        (0, type_graphql_1.Field)(() => type_graphql_1.Int, { nullable: true }),
        __metadata("design:type", Number)
    ], PaginationInputArgs.prototype, "offset", void 0);
    __decorate([
        (0, type_graphql_1.Field)(() => OrderByInputArgs, { nullable: true }),
        __metadata("design:type", Object)
    ], PaginationInputArgs.prototype, "orderBy", void 0);
    PaginationInputArgs = __decorate([
        (0, type_graphql_1.InputType)(`${plural}PaginationInput`)
    ], PaginationInputArgs);
    types_1.TypeMap[`${plural}PaginationInput`] = PaginationInputArgs;
    for (const field of entityFields) {
        const fieldType = field.getType();
        if (field.name !== 'id' && fieldType && !supportedOrderByTypes.has(fieldType.name)) {
            continue;
        }
        const fieldCopy = Object.assign({}, field);
        fieldCopy.target = OrderByInputArgs;
        fieldCopy.typeOptions = { nullable: true };
        fieldCopy.getType = () => types_1.Sort;
        metadata.collectClassFieldMetadata(fieldCopy);
    }
    let BaseResolver = class BaseResolver {
        // List
        async list(filter, pagination) {
            const result = await query_manager_1.QueryManager.find({
                entityName: gqlEntityTypeName,
                filter,
                pagination,
            });
            if (gqlEntityType.fromBackendEntity) {
                const { fromBackendEntity } = gqlEntityType;
                return result.map((entity) => fromBackendEntity.call(gqlEntityType, entity));
            }
            return result; // if there's no conversion function, we assume the gql and backend types match
        }
        // Get One
        async getOne(id) {
            const result = await provider.findOne(id);
            if (result && gqlEntityType.fromBackendEntity) {
                return gqlEntityType.fromBackendEntity.call(gqlEntityType, result);
            }
            return result; // if there's no conversion function, we assume the gql and backend types match
        }
    };
    __decorate([
        (0, type_graphql_1.Query)(() => [gqlEntityType], {
            name: plural.charAt(0).toLowerCase() + plural.substring(1),
        }),
        __param(0, (0, type_graphql_1.Arg)('filter', () => ListInputFilterArgs, { nullable: true })),
        __param(1, (0, type_graphql_1.Arg)('pagination', () => PaginationInputArgs, { nullable: true })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "list", null);
    __decorate([
        (0, type_graphql_1.Query)(() => gqlEntityType, {
            name: gqlEntityTypeName.charAt(0).toLowerCase() + gqlEntityTypeName.substring(1),
            nullable: true,
        }),
        __param(0, (0, type_graphql_1.Arg)('id', () => type_graphql_1.ID)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "getOne", null);
    BaseResolver = __decorate([
        (0, type_graphql_1.Resolver)({ isAbstract: true })
    ], BaseResolver);
    // If it's read only we're done here.
    if ((0, decorators_1.isReadOnly)(gqlEntityType))
        return BaseResolver;
    // Create Insert Input Args:
    let InsertInputArgs = class InsertInputArgs {
    };
    InsertInputArgs = __decorate([
        (0, type_graphql_1.InputType)(`${gqlEntityTypeName}InsertInput`)
    ], InsertInputArgs);
    types_1.TypeMap[`${gqlEntityTypeName}InsertInput`] = InsertInputArgs;
    for (const field of entityFields) {
        if (field.name === 'id' ||
            (0, decorators_1.isExcludedFromInputTypes)(field.target, field.name) ||
            (0, decorators_1.isReadOnlyProperty)(field.target, field.name)) {
            continue;
        }
        const fieldCopy = Object.assign({}, field);
        // To ensure we get a deep copy.
        fieldCopy.typeOptions = { ...field.typeOptions };
        fieldCopy.target = InsertInputArgs;
        // We need to translate from entity fields, e.g. a course => subject needs to actually become
        // course insert input args => subject insert input args.
        //
        // Do this lazily to ensure we handle circular references.
        fieldCopy.getType = () => {
            // Look for an associated ListFilter class, or if it doesn't exist just pass the
            // original type, as we can also setup input args as the entities themselves.
            const typeName = determineTypeName(field.getType());
            // If it doesn't have a name it might be an enum or similar.
            return typeName
                ? types_1.TypeMap[`${(0, pluralize_1.default)(typeName)}CreateOrUpdateInput`] || field.getType()
                : field.getType();
        };
        if (field.getType() !== String && field.getType() !== Number) {
            fieldCopy.typeOptions.nullable = true;
        }
        metadata.collectClassFieldMetadata(fieldCopy);
    }
    // Create Insert Many Input Args:
    let InsertManyInputArgs = class InsertManyInputArgs {
    };
    __decorate([
        (0, type_graphql_1.Field)(() => [InsertInputArgs]),
        __metadata("design:type", Array)
    ], InsertManyInputArgs.prototype, "data", void 0);
    InsertManyInputArgs = __decorate([
        (0, type_graphql_1.InputType)(`${plural}InsertManyInput`)
    ], InsertManyInputArgs);
    types_1.TypeMap[`${plural}InsertManyInput`] = InsertManyInputArgs;
    // Create Update Input Args:
    let UpdateInputArgs = class UpdateInputArgs {
    };
    UpdateInputArgs = __decorate([
        (0, type_graphql_1.InputType)(`${gqlEntityTypeName}CreateOrUpdateInput`)
    ], UpdateInputArgs);
    types_1.TypeMap[`${plural}CreateOrUpdateInput`] = UpdateInputArgs;
    for (const field of entityFields) {
        if ((0, decorators_1.isExcludedFromInputTypes)(field.target, field.name) ||
            (0, decorators_1.isReadOnlyProperty)(field.target, field.name))
            continue;
        const fieldCopy = Object.assign({}, field);
        fieldCopy.target = UpdateInputArgs;
        // All fields except ID are nullable in this type.
        fieldCopy.typeOptions = {
            ...field.typeOptions,
            nullable: true, // all fields optional to support nested create/update scenarios. Previously checked whether field.name !== 'id'
        };
        // We need to translate from entity fields, e.g. a course => subject needs to actually become
        // course update input args => subject update input args.
        //
        // Do this lazily to ensure we handle circular references.
        fieldCopy.getType = () => {
            // Look for an associated ListFilter class, or if it doesn't exist just pass the
            // original type, as we can also setup input args as the entities themselves.
            const typeName = determineTypeName(field.getType());
            // If it doesn't have a name it might be an enum or similar.
            return typeName
                ? types_1.TypeMap[`${(0, pluralize_1.default)(typeName)}CreateOrUpdateInput`] || field.getType()
                : field.getType();
        };
        metadata.collectClassFieldMetadata(fieldCopy);
    }
    // Create Update Many Input Args:
    let UpdateManyInputArgs = class UpdateManyInputArgs {
    };
    __decorate([
        (0, type_graphql_1.Field)(() => [UpdateInputArgs]),
        __metadata("design:type", Array)
    ], UpdateManyInputArgs.prototype, "data", void 0);
    UpdateManyInputArgs = __decorate([
        (0, type_graphql_1.InputType)(`${plural}UpdateManyInput`)
    ], UpdateManyInputArgs);
    types_1.TypeMap[`${plural}UpdateManyInput`] = UpdateManyInputArgs;
    // Create or Update Many Input Args:
    let CreateOrUpdateManyInputArgs = class CreateOrUpdateManyInputArgs {
    };
    __decorate([
        (0, type_graphql_1.Field)(() => [UpdateInputArgs, InsertInputArgs]),
        __metadata("design:type", Object)
    ], CreateOrUpdateManyInputArgs.prototype, "data", void 0);
    CreateOrUpdateManyInputArgs = __decorate([
        (0, type_graphql_1.InputType)(`${plural}CreateOrUpdateManyInput`)
    ], CreateOrUpdateManyInputArgs);
    types_1.TypeMap[`${plural}CreateOrUpdateManyInput`] = CreateOrUpdateManyInputArgs;
    let WritableBaseResolver = class WritableBaseResolver extends BaseResolver {
        // Create many items in a transaction
        async createMany(createItems) {
            // Transform attributes which are one-to-many / many-to-many relationships
            let createData = createItems.data;
            // The type may want to further manipulate the input before passing it to the provider.
            if (gqlEntityType.mapInputForInsertOrUpdate) {
                const { mapInputForInsertOrUpdate } = gqlEntityType;
                createData = createData.map((createItem) => mapInputForInsertOrUpdate(createItem));
            }
            const entities = await provider.createMany(createData);
            if (gqlEntityType.fromBackendEntity) {
                const { fromBackendEntity } = gqlEntityType;
                return entities.map((entity) => fromBackendEntity.call(gqlEntityType, entity));
            }
            return entities;
        }
        // Create
        async createItem(createItemData) {
            // Transform attributes which are one-to-many / many-to-many relationships
            let createData = createItemData;
            // The type may want to further manipulate the input before passing it to the provider.
            if (gqlEntityType.mapInputForInsertOrUpdate) {
                createData = gqlEntityType.mapInputForInsertOrUpdate(createData);
            }
            // Save!
            const entity = await provider.create(createData);
            if (gqlEntityType.fromBackendEntity) {
                return gqlEntityType.fromBackendEntity.call(gqlEntityType, entity);
            }
            return entity; // they're saying there's no need to map, so types don't align, but we trust the dev.
        }
        // Update many items in a transaction
        async updateMany(updateItems) {
            // Transform attributes which are one-to-many / many-to-many relationships
            let updateData = updateItems.data;
            // The type may want to further manipulate the input before passing it to the provider.
            if (gqlEntityType.mapInputForInsertOrUpdate) {
                const { mapInputForInsertOrUpdate } = gqlEntityType;
                updateData = updateData.map((updateItem) => mapInputForInsertOrUpdate(updateItem));
            }
            const entities = await provider.updateMany(updateData);
            if (gqlEntityType.fromBackendEntity) {
                const { fromBackendEntity } = gqlEntityType;
                return entities.map((entity) => fromBackendEntity.call(gqlEntityType, entity));
            }
            return entities;
        }
        // CreateOrUpdate many items in a transaction
        async createOrUpdateMany(items) {
            // Transform attributes which are one-to-many / many-to-many relationships
            let data = items.data;
            // The type may want to further manipulate the input before passing it to the provider.
            if (gqlEntityType.mapInputForInsertOrUpdate) {
                const { mapInputForInsertOrUpdate } = gqlEntityType;
                data = data.map((updateItem) => mapInputForInsertOrUpdate(updateItem));
            }
            const entities = await provider.createOrUpdateMany(data);
            if (gqlEntityType.fromBackendEntity) {
                const { fromBackendEntity } = gqlEntityType;
                return entities.map((entity) => fromBackendEntity.call(gqlEntityType, entity));
            }
            return entities;
        }
        // Update
        async update(updateItemData) {
            // Transform attributes which are one-to-many / many-to-many relationships
            let updateData = updateItemData;
            // The type may want to further manipulate the input before passing it to the provider.
            if (gqlEntityType.mapInputForInsertOrUpdate) {
                updateData = gqlEntityType.mapInputForInsertOrUpdate(updateData);
            }
            // Update and save!
            const result = await provider.update(updateItemData.id, updateData);
            if (gqlEntityType.fromBackendEntity) {
                const { fromBackendEntity } = gqlEntityType;
                return fromBackendEntity.call(gqlEntityType, result);
            }
            return result; // they're saying there's no need to map, so types don't align, but we trust the dev.
        }
        // Delete
        deleteItem(id) {
            return provider.delete(id);
        }
    };
    __decorate([
        (0, type_graphql_1.Mutation)((returns) => [gqlEntityType], { name: `create${plural}` }),
        __param(0, (0, type_graphql_1.Arg)('input', () => InsertManyInputArgs)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], WritableBaseResolver.prototype, "createMany", null);
    __decorate([
        (0, type_graphql_1.Mutation)((returns) => gqlEntityType, { name: `create${gqlEntityTypeName}` }),
        __param(0, (0, type_graphql_1.Arg)('data', () => InsertInputArgs)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], WritableBaseResolver.prototype, "createItem", null);
    __decorate([
        (0, type_graphql_1.Mutation)((returns) => [gqlEntityType], { name: `update${plural}` }),
        __param(0, (0, type_graphql_1.Arg)('input', () => UpdateManyInputArgs)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], WritableBaseResolver.prototype, "updateMany", null);
    __decorate([
        (0, type_graphql_1.Mutation)((returns) => [gqlEntityType], { name: `createOrUpdateMany${plural}` }),
        __param(0, (0, type_graphql_1.Arg)('input', () => CreateOrUpdateManyInputArgs)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], WritableBaseResolver.prototype, "createOrUpdateMany", null);
    __decorate([
        (0, type_graphql_1.Mutation)((returns) => gqlEntityType, { name: `update${gqlEntityTypeName}` }),
        __param(0, (0, type_graphql_1.Arg)('data', () => UpdateInputArgs)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], WritableBaseResolver.prototype, "update", null);
    __decorate([
        (0, type_graphql_1.Mutation)((returns) => Boolean, { name: `delete${gqlEntityTypeName}` }),
        __param(0, (0, type_graphql_1.Arg)('id', () => type_graphql_1.ID)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", void 0)
    ], WritableBaseResolver.prototype, "deleteItem", null);
    WritableBaseResolver = __decorate([
        (0, type_graphql_1.Resolver)({ isAbstract: true })
    ], WritableBaseResolver);
    return WritableBaseResolver;
}
exports.createBaseResolver = createBaseResolver;
