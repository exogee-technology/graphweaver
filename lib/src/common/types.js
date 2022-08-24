"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENERIC_AUTH_ERROR_MESSAGE = exports.BASE_ROLE_EVERYONE = exports.AccessType = exports.TypeMap = exports.Sort = void 0;
const type_graphql_1 = require("type-graphql");
var Sort;
(function (Sort) {
    Sort["ASC"] = "asc";
    Sort["DESC"] = "desc";
})(Sort = exports.Sort || (exports.Sort = {}));
exports.TypeMap = {};
(0, type_graphql_1.registerEnumType)(Sort, {
    name: 'Sort',
});
var AccessType;
(function (AccessType) {
    AccessType["Read"] = "Read";
    AccessType["Create"] = "Create";
    AccessType["Update"] = "Update";
    AccessType["Delete"] = "Delete";
})(AccessType = exports.AccessType || (exports.AccessType = {}));
exports.BASE_ROLE_EVERYONE = 'Everyone';
exports.GENERIC_AUTH_ERROR_MESSAGE = 'Forbidden';
