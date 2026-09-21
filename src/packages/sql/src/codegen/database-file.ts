import type { DialectName } from '../dialect/dialect';
import type { NamingStrategyName } from '../mapping/naming';

/**
 * Marks a string that should appear in the generated source as code rather than as a quoted
 * literal, so a certificate path can become a `readFileSync` call instead of an inlined key.
 *
 * Carried over from the existing generator, where it was added for the SSL work.
 */
export class CodeExpression {
	constructor(readonly code: string) {}
}

const serialise = (value: unknown, indent = 1): string => {
	const pad = '\t'.repeat(indent);
	const closingPad = '\t'.repeat(indent - 1);

	if (value instanceof CodeExpression) return value.code;
	if (value === null) return 'null';
	if (typeof value === 'string') return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);

	if (Array.isArray(value)) {
		if (!value.length) return '[]';
		return `[\n${value.map((entry) => `${pad}${serialise(entry, indent + 1)}`).join(',\n')}\n${closingPad}]`;
	}

	if (typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>).filter(
			([, entry]) => entry !== undefined
		);
		if (!entries.length) return '{}';

		return `{\n${entries
			.map(([key, entry]) => `${pad}${key}: ${serialise(entry, indent + 1)}`)
			.join(',\n')}\n${closingPad}}`;
	}

	return 'undefined';
};

const DIALECT_PACKAGES: Record<DialectName, { module: string; factory: string }> = {
	postgres: { module: '@exogee/graphweaver-sql-postgres', factory: 'postgres' },
	mysql: { module: '@exogee/graphweaver-sql-mysql', factory: 'mysql' },
	sqlite: { module: '@exogee/graphweaver-sql-sqlite', factory: 'sqlite' },
	mssql: { module: '@exogee/graphweaver-sql-mssql', factory: 'mssql' },
};

export interface DatabaseFileOptions {
	dialect: DialectName;
	connectionId: string;
	/** Everything the dialect factory takes. Values may be CodeExpression. */
	connection: Record<string, unknown>;
	namingStrategy?: NamingStrategyName;
	/** Set when any connection value is a readFileSync call. */
	needsReadFileSync?: boolean;
}

export const renderDatabaseFile = (options: DatabaseFileOptions) => {
	const dialect = DIALECT_PACKAGES[options.dialect];

	const imports = [
		options.needsReadFileSync ? `import { readFileSync } from 'node:fs';` : undefined,
		`import { defineConnection } from '@exogee/graphweaver-sql';`,
		`import { ${dialect.factory} } from '${dialect.module}';`,
	]
		.filter(Boolean)
		.join('\n');

	const connectionOptions = serialise(options.connection, 2);

	return `${imports}

export const connection = defineConnection({
	id: '${options.connectionId}',
	dialect: ${dialect.factory}(${connectionOptions}),${
		options.namingStrategy ? `\n\tnamingStrategy: '${options.namingStrategy}',` : ''
	}
});

export const connections = [connection];
`;
};
