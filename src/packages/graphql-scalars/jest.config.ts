import base from '../../jest.config.base';

export default {
	...base,
	displayName: 'fetch-xml',
	preset: 'ts-jest',
	globals: {
		'ts-jest': {
			tsconfig: './tsconfig.json',
		},
	},
};
