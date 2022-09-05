import base from '../../jest.config.base';
// import type { Config } from '@jest/types'; TODO: not working at runtime.

const config /* : Config.InitialOptions */ = {
	...base,
	displayName: 'graphql-api',
	preset: 'ts-jest',
	globals: {
		'ts-jest': {
			tsconfig: './tsconfig.json',
		},
	},
	setupFiles: ['./jest.setup.js'],
};

export default config;
