"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = void 0;
const pluralize_1 = __importDefault(require("pluralize"));
const type_graphql_1 = require("type-graphql");
const types_1 = require("../common/types");
const Pagination = (GraphqlEntityType) => {
    return ({ constructor: target }, methodName, index) => {
        const metadata = (0, type_graphql_1.getMetadataStorage)();
        metadata.collectHandlerParamMetadata({
            kind: 'arg',
            name: 'pagination',
            description: 'Paginate the returned results',
            target,
            getType: () => {
                const entityType = GraphqlEntityType();
                const objectMetadata = metadata.objectTypes.find((objectMetadata) => objectMetadata.target === entityType);
                if (!objectMetadata)
                    throw new Error(`Could not locate metadata for ${GraphqlEntityType}`);
                return types_1.TypeMap[`${(0, pluralize_1.default)(objectMetadata.name)}PaginationInput`];
            },
            methodName,
            index,
            typeOptions: { nullable: true },
            validate: undefined,
        });
    };
};
exports.Pagination = Pagination;
