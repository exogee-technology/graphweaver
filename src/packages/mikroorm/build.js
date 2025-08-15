const validateMikroOrmPeerAndDevVersionsMatch = async () => {
	const path = await import('node:path');
	const fs = await import('node:fs/promises');

	// The version of MikroORM in our dev and peer dependencies must match.
	const { devDependencies, peerDependencies } = JSON.parse(
		await fs.readFile(path.resolve('package.json'), 'utf-8')
	);

	// Let's make sure that the version in dev and peer match.
	const devVersion = devDependencies['@mikro-orm/core'];
	const peerVersion = peerDependencies['@mikro-orm/core'];
	if (devVersion.split('.')[0] !== peerVersion) {
		throw new Error(
			`The version of @mikro-orm/core in the mikroorm package's devDependencies (${devVersion}) and peerDependencies (${peerVersion}) do not match.`
		);
	}
};

(async () => {
	const esbuild = await import('esbuild');
	const { glob } = await import('glob');
	const fs = await import('node:fs/promises');

	await validateMikroOrmPeerAndDevVersionsMatch();

	await fs.rm('lib', { recursive: true, force: true });
	const entryPoints = await glob('./src/**/*.ts', { ignore: '**/*.test.ts' });
	await esbuild.build({
		outdir: 'lib',
		format: 'cjs',
		platform: 'node',
		sourcemap: 'linked',
		entryPoints,
	});
})();
