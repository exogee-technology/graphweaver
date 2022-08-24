"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const bunyan_1 = __importDefault(require("bunyan"));
const validLevels = {
    warn: true,
    trace: true,
    debug: true,
    info: true,
    error: true,
    fatal: true,
};
const level = process.env.LOGGING_LEVEL || 'info';
if (!validLevels[level])
    throw new Error(`Invalid logging level ${level}, valid levels are ${Object.keys(validLevels).join(', ')}`);
exports.logger = bunyan_1.default.createLogger({
    name: 'nscc-easy',
    level,
});
