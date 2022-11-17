module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
	],
	env: {
		es6: true,
		node: true,
	},
	rules: {
		// We are never going to fiddle with our object prototypes and
		// see writing Object.prototype.hasOwnProperty.call(foo, 'bar');
		// as unnecessarily verbose compared to
		// foo.hasOwnProperty('bar');
		'no-prototype-builtins': 'off',

		// We've configured TypeScript itself to check this.
		'@typescript-eslint/no-unused-vars': 'off',

		// While it'd be nice to enforce this in general it gets confused with
		// decorators and is otherwise very noisy.
		'@typescript-eslint/explicit-module-boundary-types': 'off',

		// When you use 'any' explicitly we trust you. If the best type isn't
		// 'any' this should be picked up in a code review at this stage.
		// We can enable this rule later if we want it.
		'@typescript-eslint/no-explicit-any': 'off',

		// Empty functions can actually be quite handy.
		'@typescript-eslint/no-empty-function': 'off',

		// As can empty interfaces (indeed we need them to type reference entities in Mikro)
		'@typescript-eslint/no-empty-interface': 'off',
	},
};
