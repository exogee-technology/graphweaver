import type { DialectName } from '../dialect/dialect';
import { buildEntityModels } from '../introspection/entity-model';
import type { DatabaseSchemaIR } from '../introspection/schema-ir';
import { namingStrategies, type NamingStrategyName } from '../mapping/naming';
import { renderDatabaseFile, type DatabaseFileOptions } from './database-file';
import { kebabCase, renderEntityFile, renderIndexFile } from './entity-file';

export interface GeneratedFile {
	/** Relative to the project's `src` directory. */
	path: string;
	contents: string;
	/** Prompt before overwriting: this one is likely to have been hand-edited. */
	warnBeforeOverwrite: boolean;
}

export interface GenerateOptions {
	schema: DatabaseSchemaIR;
	dialect: DialectName;
	connectionId: string;
	connection: Record<string, unknown>;
	namingStrategy?: NamingStrategyName;
	needsReadFileSync?: boolean;
}

/**
 * Chooses the naming strategy that reproduces the most real identifiers.
 *
 * This is the difference between generated code somebody will hand-edit and code they will not: on
 * a PascalCase schema like Chinook, `snakeCase` puts an explicit `column:` on every single line,
 * while `preserve` leaves only the handful that genuinely differ.
 */
export const chooseNamingStrategy = (schema: DatabaseSchemaIR): NamingStrategyName => {
	let best: NamingStrategyName = 'snakeCase';
	let bestScore = -1;

	for (const [name, strategy] of Object.entries(namingStrategies)) {
		let score = 0;

		for (const table of schema.tables) {
			for (const column of table.columns) {
				// Score by round trip: would the strategy reproduce this column from the property
				// name we would derive for it?
				const property = column.name
					.replace(/[_\s]+([^\W_])/g, (_, character: string) => character.toUpperCase())
					.replace(/^(\p{Lu})(?=\p{Ll})/u, (character) => character.toLowerCase());

				if (strategy.columnName(property) === column.name) score++;
			}
		}

		if (score > bestScore) {
			bestScore = score;
			best = name as NamingStrategyName;
		}
	}

	return best;
};

export const generateFiles = (options: GenerateOptions) => {
	const strategyName = options.namingStrategy ?? chooseNamingStrategy(options.schema);
	const { entities, errors, warnings } = buildEntityModels(
		options.schema,
		namingStrategies[strategyName]
	);

	const files: GeneratedFile[] = entities.map((entity) => ({
		path: `backend/schema/${kebabCase(entity.name)}.ts`,
		contents: renderEntityFile(entity),
		warnBeforeOverwrite: false,
	}));

	files.push({
		path: 'backend/schema/index.ts',
		contents: renderIndexFile(entities),
		// Likely to have hand-written entities exported from it too.
		warnBeforeOverwrite: true,
	});

	files.push({
		path: 'backend/database.ts',
		contents: renderDatabaseFile({
			dialect: options.dialect,
			connectionId: options.connectionId,
			connection: options.connection,
			namingStrategy: strategyName,
			needsReadFileSync: options.needsReadFileSync,
		} satisfies DatabaseFileOptions),
		warnBeforeOverwrite: true,
	});

	return { files, errors, warnings, namingStrategy: strategyName };
};
