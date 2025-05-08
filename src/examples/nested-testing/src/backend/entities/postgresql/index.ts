import { Childwithbackendid } from './childwithbackendid';
import { Childwithclientid } from './childwithclientid';
import { Rootwithbackendid } from './rootwithbackendid';
import { Rootwithclientid } from './rootwithclientid';

export * from './childwithbackendid';
export * from './childwithclientid';
export * from './rootwithbackendid';
export * from './rootwithclientid';

export const entities = [
	Childwithbackendid,
	Childwithclientid,
	Rootwithbackendid,
	Rootwithclientid,
];
