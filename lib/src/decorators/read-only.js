"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReadOnly = exports.ReadOnly = void 0;
require("reflect-metadata");
const readOnlyKey = Symbol('BaseResolverReadOnly');
function ReadOnly() {
    return Reflect.metadata(readOnlyKey, true);
}
exports.ReadOnly = ReadOnly;
function isReadOnly(target) {
    return !!Reflect.getMetadata(readOnlyKey, target);
}
exports.isReadOnly = isReadOnly;
