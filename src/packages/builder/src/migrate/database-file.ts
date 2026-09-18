import { Node, SyntaxKind } from 'ts-morph';
import type { ObjectLiteralExpression, SourceFile } from 'ts-morph';
import type { MigrationIssue } from './schema-entity';

/** MikroORM names its drivers by class; the SQL provider names dialects. */
const DIALECT_FOR_DRIVER: Record<string, { factory: string; module: string }> = {
	PostgreSqlDriver: { factory: 'postgres', module: '@exogee/graphweaver-sql-postgres' },
	MySqlDriver: { factory: 'mysql', module: '@exogee/graphweaver-sql-mysql' },
	SqliteDriver: { factory: 'sqlite', module: '@exogee/graphweaver-sql-sqlite' },
	MsSqlDriver: { factory: 'mssql', module: '@exogee/graphweaver-sql-mssql' },
	BetterSqliteDriver: { factory: 'sqlite', module: '@exogee/graphweaver-sql-sqlite' },
};

/** MikroORM's connection option names, mapped onto the driver's own. */
const OPTION_NAMES: Record<string, string> = {
	dbName: 'database',
	host: 'host',
	port: 'port',
	user: 'user',
	password: 'password',
};

const propertyText = (object: ObjectLiteralExpression, name: string) => {
	const property = object.getProperty(name);
	return Node.isPropertyAssignment(property) ? property.getInitializer()?.getText() : undefined;
};

/**
 * Rewrites a `mikroOrmConfig` connection into a `defineConnection` call.
 *
 * The `entities` array goes away entirely, which is the point: there is nothing to register any
 * more, because there is no second set of entity classes.
 */
export const migrateDatabaseFile = (file: SourceFile): MigrationIssue[] => {
	const issues: MigrationIssue[] = [];
	const note = (message: string) =>
		issues.push({ file: file.getFilePath(), entity: 'database.ts', message });

	let changed = false;

	for (const declaration of file.getVariableDeclarations()) {
		const initialiser = declaration.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
		if (!initialiser) continue;

		const mikroConfig = initialiser.getProperty('mikroOrmConfig');
		if (!Node.isPropertyAssignment(mikroConfig)) continue;

		const config = mikroConfig.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
		if (!config) {
			note(
				`'${declaration.getName()}' has a mikroOrmConfig that is not an object literal, so it ` +
					`could not be migrated automatically.`
			);
			continue;
		}

		const driver = propertyText(config, 'driver');
		const dialect = driver ? DIALECT_FOR_DRIVER[driver] : undefined;

		if (!dialect) {
			note(
				`Could not work out the dialect for '${declaration.getName()}' (driver: ${
					driver ?? 'not specified'
				}), so it was left alone.`
			);
			continue;
		}

		const id = propertyText(initialiser, 'connectionManagerId') ?? `'${declaration.getName()}'`;

		const options = Object.entries(OPTION_NAMES)
			.map(([mikroName, driverName]) => {
				const value = propertyText(config, mikroName);
				if (!value) return undefined;

				// SQLite takes a filename rather than a database name.
				if (dialect.factory === 'sqlite' && mikroName === 'dbName') {
					return `filename: ${value}`;
				}

				// tedious calls it `server`, everyone else calls it `host`.
				if (dialect.factory === 'mssql' && mikroName === 'host') {
					return `server: ${value}`;
				}

				return `${driverName}: ${value}`;
			})
			.filter(Boolean);

		declaration.setInitializer(
			`defineConnection({\n\tid: ${id},\n\tdialect: ${dialect.factory}({ ${options.join(', ')} }),\n})`
		);

		file.addImportDeclaration({
			moduleSpecifier: dialect.module,
			namedImports: [dialect.factory],
		});
		changed = true;
	}

	if (!changed) return issues;

	file.addImportDeclaration({
		moduleSpecifier: '@exogee/graphweaver-sql',
		namedImports: ['defineConnection'],
	});

	// Nothing imports a MikroORM driver or the entities barrel any more.
	for (const declaration of file.getImportDeclarations()) {
		const module = declaration.getModuleSpecifierValue();
		if (
			module.startsWith('@mikro-orm/') ||
			module.endsWith('/entities') ||
			module === './entities'
		) {
			declaration.remove();
		}
	}

	file.organizeImports();
	return issues;
};
