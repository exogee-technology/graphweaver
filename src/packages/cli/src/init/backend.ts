import { Backend } from '.';
import { graphweaverVersion } from './constants';

/**
 * The driver each dialect package needs.
 *
 * These are *peer* dependencies of the dialect packages rather than dependencies, so the user pins
 * their own driver version -- which matters across a major like pg 8 to 9. They are listed here
 * explicitly rather than left to the package manager's peer auto-install, so a generated project
 * says what it depends on.
 */
export const DRIVER_VERSIONS: Record<string, string> = {
	pg: '8.16.3',
	mysql2: '3.15.3',
	tedious: '19.1.3',
	tarn: '3.0.2',
	'node-sqlite3-wasm': '0.8.53',
};

export const driverPackageForSource = (source: 'postgresql' | 'mysql' | 'sqlite' | 'mssql') =>
	({
		postgresql: 'pg',
		mysql: 'mysql2',
		sqlite: 'node-sqlite3-wasm',
		mssql: 'tedious',
	})[source];

const sqlPackages = (
	dialect: 'postgres' | 'mysql' | 'sqlite' | 'mssql',
	driver: string,
	version?: string
) => ({
	'@exogee/graphweaver-sql': graphweaverVersion(version, '@exogee/graphweaver-sql'),
	[`@exogee/graphweaver-sql-${dialect}`]: graphweaverVersion(
		version,
		`@exogee/graphweaver-sql-${dialect}`
	),
	[driver]: DRIVER_VERSIONS[driver],
	// tedious pools through tarn, which it does not depend on itself.
	...(dialect === 'mssql' ? { tarn: DRIVER_VERSIONS.tarn } : {}),
});

export const packagesForBackend = (backend: Backend, version?: string): Record<string, string> => {
	switch (backend) {
		case Backend.Postgres:
			return sqlPackages('postgres', 'pg', version);

		case Backend.Mysql:
			return sqlPackages('mysql', 'mysql2', version);

		case Backend.Mssql:
			return sqlPackages('mssql', 'tedious', version);

		case Backend.Sqlite:
			return sqlPackages('sqlite', 'node-sqlite3-wasm', version);

		case Backend.Rest:
			return {
				'@exogee/graphweaver-rest': graphweaverVersion(version, '@exogee/graphweaver-rest'),
			};
	}
};
