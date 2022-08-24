"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizeAccess = void 0;
const __1 = require("..");
function AuthorizeAccess(acl) {
    return function (constructor) {
        if (__1.AclMap.get(constructor.name)) {
            throw new Error(`An ACL already exists for ${constructor.name}`);
        }
        __1.AclMap.set(constructor.name, acl);
    };
}
exports.AuthorizeAccess = AuthorizeAccess;
