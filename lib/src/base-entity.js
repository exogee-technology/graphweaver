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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLEntity = exports.AclMap = void 0;
const type_graphql_1 = require("type-graphql");
const metadata = (0, type_graphql_1.getMetadataStorage)();
exports.AclMap = new Map();
let GraphQLEntity = class GraphQLEntity {
    constructor(dataEntity) {
        this.dataEntity = dataEntity;
    }
    static fromBackendEntity(dataEntity) {
        if (dataEntity === undefined) {
            throw new Error('Data entity is undefined');
        }
        const entity = new this(dataEntity);
        metadata.fields
            .filter((field) => field.target === this)
            .forEach((field) => {
            var _a, _b, _c, _d;
            const dataField = dataEntity[field.name];
            if (typeof dataField !== 'undefined' &&
                !((_b = (_a = dataEntity).isCollection) === null || _b === void 0 ? void 0 : _b.call(_a, field.name, dataField)) &&
                !((_d = (_c = dataEntity).isReference) === null || _d === void 0 ? void 0 : _d.call(_c, field.name, dataField)))
                // @todo: Can't figure out how to infer this type correctly, but this is what we want to do.
                entity[field.name] = dataField;
        });
        return entity;
    }
};
GraphQLEntity = __decorate([
    (0, type_graphql_1.ObjectType)(),
    __metadata("design:paramtypes", [Object])
], GraphQLEntity);
exports.GraphQLEntity = GraphQLEntity;
