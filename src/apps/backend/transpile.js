// We're using require here because this is a JS file that Node loads directly.
/* eslint-disable @typescript-eslint/no-var-requires */
const { join, resolve } = require('path');
const { existsSync } = require('fs');
const { readdir, stat, readFile } = require('fs/promises');
const { build } = require('esbuild');
const minimist = require('minimist');

const flags = minimist(process.argv.slice(0));

const makeAllPackagesExternalPlugin = {
	name: 'make-all-packages-external',
	setup(build) {
		const filter = /^[^./]|^\.[^./]|^\.\.[^/]/; // Must not start with "/" or "./" or "../"
		build.onResolve({ filter }, ({ path }) => {
			// On Windows, packages in the monorepo are resolved as full file paths starting with C:\ ...
			// And Go (used by esbuild) does not support regex with negative lookaheads
			return { path, external: !/^[C-Z]:\\/.test(path) };
		});
	},
};

const common = {
	// Anything in node_modules should be marked as external.
	plugins: [makeAllPackagesExternalPlugin],

	minify: false,
	bundle: true,
	sourcemap: true,
	platform: 'node',
	target: ['node14'],
};

const watchFunction = (outPath) => {
	return {
		onRebuild(error, result) {
			if (error) console.error(`Watch build for ${outPath} failed with: `, error);
			else console.log(`Watch build for ${outPath} succeeded`);
		},
	};
};

const runBuild = async () => {
	const rootDirectory = '../../packages';
	const entries = await readdir(rootDirectory);

	const tasks = entries.map(async (dir) => {
		const fullPath = join(rootDirectory, dir);
		const itemStat = await stat(fullPath);

		// Ignore files in the src/packages directory
		if (!itemStat.isDirectory()) {
			return;
		}

		if (dir.match(/^example*/)) {
			console.log('Ignoring example package');
			return;
		}

		const packageJsonPath = join(fullPath, 'package.json');

		if (!existsSync(packageJsonPath)) {
			console.warn(`Ignoring ${fullPath} as it has no package.json`);
			return;
		}

		const { source, main, module } = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

		// If source and main aren't defined, we don't need to build a CJS version of this package.
		if (source && main) {
			const outPath = resolve(fullPath, main);
			const label = `esbuild-ing ${outPath}`;
			console.time(label);
			await build({
				...common,
				format: 'cjs',
				entryPoints: [resolve(fullPath, source)],
				outfile: outPath,
				watch: flags.watch ? watchFunction(outPath) : undefined,
			});
			console.timeEnd(label);
		}

		// If source and module aren't defined, we don't need to build an ESM version of this package.
		if (source && module) {
			const outPath = resolve(fullPath, module);
			const label = `esbuild-ing module ${outPath}`;
			console.time(label);
			await build({
				...common,
				format: 'esm',
				entryPoints: [resolve(fullPath, source)],
				outfile: outPath,
				watch: flags.watch ? watchFunction(outPath) : undefined,
			});
			console.timeEnd(label);
		}
	});

	return Promise.all(tasks);
};

runBuild()
	.then(() => {
		console.log('Build completed successfully');
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
