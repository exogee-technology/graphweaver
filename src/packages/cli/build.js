/* eslint-disable @typescript-eslint/no-var-requires */
const { exec: nodeExec } = require('child_process');
const path = require('node:path');
const fs = require('node:fs/promises');
const { promisify } = require('util');

const { build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');

const exec = promisify(nodeExec);

const validateMikroOrmExpectedVersion = async () => {
	// The CLI has the introspection operation. We need to make sure our target
	// MikroORM version matches with the version specified in the mikro-orm adapter
	// package.json file or the build should fail.
	const {
		devDependencies: mikroDevDependencies,
		peerDependencies: mikroPeerDependencies,
	} = require(path.resolve('..', 'mikroorm', 'package.json'));

	// Let's make sure first that the version in dev and peer match.
	const devVersion = mikroDevDependencies['@mikro-orm/core'];
	const peerVersion = mikroPeerDependencies['@mikro-orm/core'];
	if (devVersion !== peerVersion) {
		throw new Error(
			`The version of @mikro-orm/core in the mikroorm package's devDependencies (${devVersion}) and peerDependencies (${peerVersion}) do not match.`
		);
	}

	// Ok, what's ours?
	const searchPattern = /export const MIKRO_ORM_TARGET_VERSION = '(.+)';/;
	const constantsContents = await fs.readFile(path.resolve('src', 'init', 'constants.ts'), 'utf-8');
	const match = searchPattern.exec(constantsContents);
	if (!match) {
		throw new Error(`Could not find MIKRO_ORM_TARGET_VERSION in src/init/constants.ts.`);
	}
	const MIKRO_ORM_TARGET_VERSION = match[1];

	if (peerVersion !== MIKRO_ORM_TARGET_VERSION) {
		throw new Error(
			`The version of @mikro-orm/core in the mikroorm package's peerDependencies (${peerVersion}) does not match the target version in the CLI (${MIKRO_ORM_TARGET_VERSION}). Update the CLI package's src/init/constants.ts file to match the target version.`
		);
	}
};

(async () => {
	await validateMikroOrmExpectedVersion();

	// Build the CLI
	await build({
		entryPoints: ['./src/index.ts'],
		outdir: 'bin',
		bundle: true,
		platform: 'node',
		banner: { js: '#!/usr/bin/env node' },
		sourcemap: 'linked',
		external: [
			// Our dependencies will be installed in node_modules. The bundling is
			// just to ensure our own files are pulled in
			...Object.keys(dependencies),
			...Object.keys(devDependencies),
		],
	});

	// TODO: This won't work on Windows, guard accordingly.
	await exec('chmod 755 bin/index.js');
})();
