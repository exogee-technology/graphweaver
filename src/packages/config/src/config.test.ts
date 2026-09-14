import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';

import { config, ConfigOptions, defaultConfig } from './config';

// Fixtures live under the package root rather than the OS temp directory so that node_modules
// resolution from inside a fixture walks up and finds ours, the same way it would in a real
// project. They're kept out of `src` so `tsc` doesn't try to build them.
const FIXTURE_ROOT = join(__dirname, '..', '.test-fixtures');
mkdirSync(FIXTURE_ROOT, { recursive: true });

// `defaultConfig()` hands back a fresh set of `onResolve...` callbacks every call, and those
// never compare equal to each other, so compare only the data-bearing half of the config.
const dataOnly = (options: ConfigOptions) => JSON.parse(JSON.stringify(options));

const project = (files: Record<string, string>) => {
	const root = mkdtempSync(join(FIXTURE_ROOT, 'project-'));
	for (const [name, contents] of Object.entries(files)) {
		writeFileSync(join(root, name), contents);
	}
	return root;
};

afterEach(() => {
	vi.restoreAllMocks();
});

afterAll(() => {
	rmSync(FIXTURE_ROOT, { recursive: true, force: true });
});

describe('config', () => {
	test('falls back to the defaults when the project has no config file', () => {
		expect(dataOnly(config(project({})))).toEqual(dataOnly(defaultConfig()));
	});

	test('loads a CommonJS graphweaver-config.js', () => {
		const root = project({
			'graphweaver-config.js': `module.exports = { adminUI: { customPagesPath: 'js/pages' } };`,
		});

		expect(config(root).adminUI.customPagesPath).toBe('js/pages');
	});

	test('loads a graphweaver-config.ts that uses export default', () => {
		const root = project({
			'graphweaver-config.ts': `
				const customPagesPath: string = 'ts/pages';
				export default { adminUI: { customPagesPath } };
			`,
		});

		expect(config(root).adminUI.customPagesPath).toBe('ts/pages');
	});

	test('loads a graphweaver-config.ts that uses named exports', () => {
		const root = project({
			'graphweaver-config.ts': `export const adminUI = { customPagesPath: 'named/pages' };`,
		});

		expect(config(root).adminUI.customPagesPath).toBe('named/pages');
	});

	test('prefers TypeScript over JavaScript when a project has both', () => {
		const root = project({
			'graphweaver-config.js': `module.exports = { adminUI: { customPagesPath: 'js/pages' } };`,
			'graphweaver-config.ts': `export default { adminUI: { customPagesPath: 'ts/pages' } };`,
		});

		expect(config(root).adminUI.customPagesPath).toBe('ts/pages');
	});

	test('bundles helpers the config imports from elsewhere in the project', () => {
		const root = project({
			// No file extension, which plain TypeScript-in-Node can't resolve but a bundler can.
			'graphweaver-config.ts': `
				import { webGlobs } from './globs';
				export default { trustedDocuments: { allowLists: { web: webGlobs } } };
			`,
			'globs.ts': `export const webGlobs: string[] = ['src/frontend/web/**/*.graphql'];`,
		});

		expect(config(root).trustedDocuments.allowLists).toEqual({
			web: ['src/frontend/web/**/*.graphql'],
		});
	});

	test('leaves node_modules imports to be resolved from the project at run time', () => {
		const root = project({
			'graphweaver-config.ts': `
				import { kebabCase } from 'lodash';
				export default { adminUI: { customPagesPath: kebabCase('Custom Pages') } };
			`,
		});

		expect(config(root).adminUI.customPagesPath).toBe('custom-pages');
	});

	test('supports TypeScript syntax that needs more than type stripping, such as enums', () => {
		const root = project({
			'graphweaver-config.ts': `
				enum Pages { CUSTOM = 'enum/pages' }
				export default { adminUI: { customPagesPath: Pages.CUSTOM } };
			`,
		});

		expect(config(root).adminUI.customPagesPath).toBe('enum/pages');
	});

	test('merges the custom config over the defaults instead of replacing them', () => {
		const root = project({
			'graphweaver-config.ts': `export default { adminUI: { customPagesPath: 'ts/pages' } };`,
		});

		const { adminUI } = config(root);

		expect(adminUI.customPagesPath).toBe('ts/pages');
		expect(adminUI.customFieldsPath).toBe(defaultConfig().adminUI.customFieldsPath);
		expect(adminUI.auth?.password?.enableForgottenPassword).toBe(true);
	});

	test('warns and falls back to the defaults when a TypeScript config does not compile', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const root = project({ 'graphweaver-config.ts': `export default { adminUI: {` });

		expect(dataOnly(config(root))).toEqual(dataOnly(defaultConfig()));
		expect(warn).toHaveBeenCalled();
	});

	test('does not warn when the project simply has no config file', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		config(project({}));

		expect(warn).not.toHaveBeenCalled();
	});
});
