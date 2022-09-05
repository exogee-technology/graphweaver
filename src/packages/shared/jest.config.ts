export default {
	modulePathIgnorePatterns: ['lib/'],
	displayName: 'shared',
	preset: 'ts-jest',
	globals: {
		'ts-jest': {
			tsconfig: './tsconfig.json',
		},
	},
};
