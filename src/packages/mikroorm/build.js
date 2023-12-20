const flags = process.argv.slice(0);
const flagIncludes = (flagName) => !!flags.find((flag) => flag === `--${flagName}`);

(async () => {
	const esbuild = await import('esbuild');
	await esbuild.build({
		outdir: 'lib',
		format: 'cjs',
		bundle: true,
		minify: false,
		platform: 'node',
		sourcemap: 'linked',
		entryPoints: ['src/index.ts'],
		watch: flagIncludes('watch'),
		external: [
			'oracledb',
			'pg-query-stream',
			'better-sqlite3',
			'tedious',
			'mysql',
			'oracledb',
			'@mikro-orm/seeder',
			'@mikro-orm/entity-generator',
			'@mikro-orm/migrations',
			'@mikro-orm/mongodb',
			'@mikro-orm/mariadb',
			'@mikro-orm/better-sqlite',
			'mock-aws-s3',
			'nock',
		],
	});
})();
