import base from '../../jest.config.base';

export default {
	...base,
	displayName: 'database-migration-runner',
	preset: 'ts-jest',
	globals: {
		'ts-jest': {
			tsconfig: './tsconfig.json',
		},
	},
};
