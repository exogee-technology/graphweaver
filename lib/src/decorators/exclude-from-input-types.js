"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExcludedFromInputTypes = exports.ExcludeFromInputTypes = void 0;
require("reflect-metadata");
const inputTypeExcludedKey = Symbol('BaseResolverInputTypeExcluded');
function ExcludeFromInputTypes() {
    return (target, propertyKey) => {
        // Normally we'd just return Reflect.metadata(), but TypeGraphQL works on the constructor
        // as the target, so we need to as well for later.
        Reflect.metadata(inputTypeExcludedKey, true)(target.constructor, propertyKey);
    };
}
exports.ExcludeFromInputTypes = ExcludeFromInputTypes;
function isExcludedFromInputTypes(target, propertyKey) {
    return !!Reflect.getMetadata(inputTypeExcludedKey, target, propertyKey);
}
exports.isExcludedFromInputTypes = isExcludedFromInputTypes;
