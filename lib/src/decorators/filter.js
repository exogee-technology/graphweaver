"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filter = void 0;
const pluralize_1 = __importDefault(require("pluralize"));
const type_graphql_1 = require("type-graphql");
const types_1 = require("../common/types");
const Filter = (GraphqlEntityType) => {
    return ({ constructor: target }, methodName, index) => {
        const gqlEntityType = GraphqlEntityType();
        const plural = (0, pluralize_1.default)(gqlEntityType.name);
        const typeMap = types_1.TypeMap[`${plural}FilterInput`];
        const metadata = (0, type_graphql_1.getMetadataStorage)();
        metadata.collectHandlerParamMetadata({
            kind: 'arg',
            name: 'filter',
            description: 'Filter the returned results',
            target,
            getType: () => {
                return typeMap;
            },
            methodName,
            index,
            typeOptions: { nullable: true },
            validate: undefined,
        });
    };
};
exports.Filter = Filter;
