"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExcludedFromFilterType = exports.ExcludeFromFilterType = void 0;
require("reflect-metadata");
const filterTypeExcludedKey = Symbol('BaseResolverFilterTypeExcluded');
function ExcludeFromFilterType() {
    return (target, propertyKey) => {
        // Normally we'd just return Reflect.metadata(), but TypeGraphQL works on the constructor
        // as the target, so we need to as well for later.
        Reflect.metadata(filterTypeExcludedKey, true)(target.constructor, propertyKey);
    };
}
exports.ExcludeFromFilterType = ExcludeFromFilterType;
function isExcludedFromFilterType(target, propertyKey) {
    return !!Reflect.getMetadata(filterTypeExcludedKey, target, propertyKey);
}
exports.isExcludedFromFilterType = isExcludedFromFilterType;
