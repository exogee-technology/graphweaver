// @ts-check
import ESLint from '@eslint/js';
import ESLintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import TypeScriptESLint from 'typescript-eslint';

export default TypeScriptESLint.config(
	{
		ignores: [
			'**/{app,dist,public,lib,build,.graphweaver,local_modules}/**/*',
			'examples/federation/integration/index.js',
			'packages/cli/bin/index.js',
			'packages/cli/test-init.js',
			'**/*.generated.ts',
		],
	},
	ESLint.configs.recommended,
	...TypeScriptESLint.configs.recommended,
	ESLintConfigPrettier,
	{
		files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
				...globals.es2021,
			},
		},
		plugins: {},
		rules: {
			// We are never going to fiddle with our object prototypes and
			// see writing Object.prototype.hasOwnProperty.call(foo, 'bar');
			// as unnecessarily verbose compared to
			// foo.hasOwnProperty('bar');
			'no-prototype-builtins': 'off',

			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					// Any variable names that start with _ in an array destructure are meant to be placeholders.
					destructuredArrayIgnorePattern: '^_',

					// We want to error on unused variables but we don't want to error
					// when they're part of a desctructure, as that's often used to pull out certain
					// keys, or the second element of an array, etc.
					ignoreRestSiblings: true,
				},
			],

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
	}
);
