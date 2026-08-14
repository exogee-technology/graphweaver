import dotenv from 'dotenv';
import { expect } from 'expect';

dotenv.config({
	path: '.env',
	quiet: true,
});

Object.assign(globalThis, { expect });
