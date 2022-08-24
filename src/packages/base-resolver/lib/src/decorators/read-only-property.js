"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReadOnlyProperty = exports.ReadOnlyProperty = void 0;
require("reflect-metadata");
const readOnlyPropertyKey = Symbol('BaseResolverReadOnlyProperty');
function ReadOnlyProperty() {
    return (target, propertyKey) => {
        // Normally we'd just return Reflect.metadata(), but TypeGraphQL works on the constructor
        // as the target, so we need to as well for later.
        Reflect.metadata(readOnlyPropertyKey, true)(target.constructor, propertyKey);
    };
}
exports.ReadOnlyProperty = ReadOnlyProperty;
function isReadOnlyProperty(target, propertyKey) {
    return !!Reflect.getMetadata(readOnlyPropertyKey, target, propertyKey);
}
exports.isReadOnlyProperty = isReadOnlyProperty;
