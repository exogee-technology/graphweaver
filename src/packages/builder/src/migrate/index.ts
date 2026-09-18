import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { IndentationText, Node, Project, QuoteKind, SyntaxKind } from 'ts-morph';
import type { ClassDeclaration, SourceFile } from 'ts-morph';
import { migrateDatabaseFile } from './database-file';
import { migrateSchemaEntity } from './schema-entity';
import type { MigrationIssue } from './schema-entity';
import { readOrmEntity } from './orm-entity';
import type { OrmEntity } from './orm-entity';

export type { MigrationIssue } from './schema-entity';

export interface MigrateOptions {
	/** The project root. Defaults to the working directory. */
	cwd?: string;
	/** Report what would change without writing anything. */
	dryRun?: boolean;
	/** Remove `src/backend/entities` once nothing references it. */
	removeEntities?: boolean;
}

export interface MigrateResult {
	changedFiles: string[];
	removedDirectories: string[];
	issues: MigrationIssue[];
}

/** Resolves `Playlist as OrmPlaylist` back to the class it names. */
const resolveOrmClass = (file: SourceFile, alias: string): ClassDeclaration | undefined => {
	for (const declaration of file.getImportDeclarations()) {
		for (const namedImport of declaration.getNamedImports()) {
			const local = namedImport.getAliasNode()?.getText() ?? namedImport.getName();
			if (local !== alias) continue;

			const symbol = namedImport.getNameNode().getSymbol();
			for (const target of symbol?.getAliasedSymbol()?.getDeclarations() ??
				symbol?.getDeclarations() ??
				[]) {
				if (Node.isClassDeclaration(target)) return target;
			}
		}
	}

	return undefined;
};

/**
 * Migrates a project from the MikroORM provider to the SQL provider.
 *
 * Works by editing the Graphweaver entities in place and folding the MikroORM entity's storage
 * facts into them, rather than regenerating. Regenerating would be far easier to write and would
 * destroy the file that holds all the hand-written work -- the hooks, the adminUIOptions, the field
 * resolvers -- while preserving the one that holds none of it.
 *
 * Anything it cannot map confidently is left untouched with a TODO comment and reported, on the
 * principle that a visible gap is better than a plausible wrong answer.
 */
export const migrateToSqlProvider = async (
	options: MigrateOptions = {}
): Promise<MigrateResult> => {
	const cwd = options.cwd ?? process.cwd();
	const schemaDirectory = join(cwd, 'src', 'backend', 'schema');
	const entitiesDirectory = join(cwd, 'src', 'backend', 'entities');
	const databaseFile = join(cwd, 'src', 'backend', 'database.ts');

	if (!existsSync(schemaDirectory)) {
		throw new Error(
			`Could not find ${schemaDirectory}. Run this from the root of a Graphweaver project.`
		);
	}

	const project = new Project({
		tsConfigFilePath: existsSync(join(cwd, 'tsconfig.json'))
			? join(cwd, 'tsconfig.json')
			: undefined,
		skipAddingFilesFromTsConfig: true,
		// Match the repo's own style so a migrated file does not show up as entirely rewritten.
		manipulationSettings: {
			indentationText: IndentationText.Tab,
			quoteKind: QuoteKind.Single,
			useTrailingCommas: true,
		},
	});

	project.addSourceFilesAtPaths([
		join(schemaDirectory, '**', '*.ts'),
		join(entitiesDirectory, '**', '*.ts'),
		databaseFile,
		// Everything else under backend too, so the report at the end can see what is left behind
		// even though only the schema and database files are rewritten.
		join(cwd, 'src', 'backend', '**', '*.ts'),
	]);

	const issues: MigrationIssue[] = [];
	const changed = new Set<SourceFile>();

	// Which schema entities are moving to the SQL provider. Needed before transforming any of
	// them, so a relationship can tell whether the other end is coming too.
	const migratedEntities = new Set<string>();
	for (const file of project.getSourceFiles(join(schemaDirectory, '**', '*.ts'))) {
		for (const declaration of file.getClasses()) {
			const usesMikroProvider = declaration
				.getDecorator('Entity')
				?.getDescendantsOfKind(SyntaxKind.NewExpression)
				.some((expression) => expression.getExpression().getText() === 'MikroBackendProvider');

			if (usesMikroProvider && declaration.getName()) migratedEntities.add(declaration.getName()!);
		}
	}

	// Read every ORM entity up front. A many-to-many owning side cannot be migrated without seeing
	// the inverse side, which lives in a different file.
	const ormEntities = new Map<string, OrmEntity>();
	for (const file of project.getSourceFiles(join(entitiesDirectory, '**', '*.ts'))) {
		for (const declaration of file.getClasses()) {
			if (!declaration.getDecorator('Entity')) continue;

			const entity = readOrmEntity(declaration);
			if (entity.className) ormEntities.set(entity.className, entity);
		}
	}

	for (const file of project.getSourceFiles(join(schemaDirectory, '**', '*.ts'))) {
		for (const entityClass of file.getClasses()) {
			const entityDecorator = entityClass.getDecorator('Entity');
			if (!entityDecorator) continue;

			const providerCall = entityDecorator
				.getDescendantsOfKind(SyntaxKind.NewExpression)
				.find((expression) => expression.getExpression().getText() === 'MikroBackendProvider');

			if (!providerCall) continue;

			const ormAlias = providerCall.getArguments()[0]?.getText();
			const ormClass = ormAlias ? resolveOrmClass(file, ormAlias) : undefined;

			if (!ormClass) {
				issues.push({
					file: file.getFilePath(),
					entity: entityClass.getName() ?? '',
					message: `Could not resolve the MikroORM entity '${ormAlias}', so this was left alone.`,
				});
				continue;
			}

			issues.push(
				...migrateSchemaEntity(
					file,
					entityClass,
					readOrmEntity(ormClass),
					ormAlias!,
					ormEntities,
					migratedEntities
				)
			);
			changed.add(file);
		}
	}

	const database = project.getSourceFile(databaseFile);
	if (database) {
		const databaseIssues = migrateDatabaseFile(database);
		issues.push(...databaseIssues);
		if (database.getFullText() !== database.getFullText()) changed.add(database);
		changed.add(database);
	}

	// Anything still importing MikroORM is application code the codemod deliberately does not
	// touch: custom queries and mutations reaching for `em` directly, or a provider built outside
	// an @Entity decorator. Rewriting those would mean guessing at what the code is for, so they
	// are reported precisely instead -- a list of files to look at beats a broken build.
	for (const file of project.getSourceFiles()) {
		if (changed.has(file)) continue;
		if (file.getFilePath().startsWith(entitiesDirectory)) continue;

		const usesMikro = file
			.getImportDeclarations()
			.some((declaration) =>
				declaration.getModuleSpecifierValue().includes('graphweaver-mikroorm')
			);

		if (!usesMikro) continue;

		const symbols = file
			.getImportDeclarations()
			.filter((declaration) =>
				declaration.getModuleSpecifierValue().includes('graphweaver-mikroorm')
			)
			.flatMap((declaration) => declaration.getNamedImports().map((entry) => entry.getName()));

		issues.push({
			file: file.getFilePath(),
			entity: file.getBaseName(),
			message:
				`Still uses MikroORM (${symbols.join(', ')}) and was left alone. This is usually a ` +
				`custom query or mutation reaching for the EntityManager directly. Replace it with the ` +
				`entity's provider -- \`Entity.provider.findOne({ ... })\` -- or with a raw query on ` +
				`the connection.`,
		});
	}

	if (options.dryRun) {
		return {
			changedFiles: [...changed].map((file) => file.getFilePath()),
			removedDirectories: [],
			issues,
		};
	}

	// Deliberately no formatText: it reindents the whole file, which would bury the real changes
	// in a diff nobody can review. Projects run their own formatter afterwards.
	for (const file of changed) await file.save();

	const removedDirectories: string[] = [];

	if (options.removeEntities !== false && existsSync(entitiesDirectory)) {
		// The entities directory often holds more than entities -- enums and shared types live
		// there too, and the schema still imports them. Deleting it because the entity classes are
		// gone would break the project in a way that is annoying to work backwards from, so only
		// remove it once genuinely nothing points at it.
		const stillReferencing = project
			.getSourceFiles()
			.filter((file) => !file.getFilePath().startsWith(entitiesDirectory))
			.filter((file) =>
				file
					.getImportDeclarations()
					.some((declaration) =>
						declaration.getModuleSpecifierSourceFile()?.getFilePath().startsWith(entitiesDirectory)
					)
			);

		if (stillReferencing.length) {
			issues.push({
				file: entitiesDirectory,
				entity: 'entities',
				message:
					`Kept src/backend/entities: ${stillReferencing.length} file(s) still import from ` +
					`it, so it holds more than just the MikroORM entities. Move what is still needed ` +
					`(enums and shared types, usually) somewhere else and delete it by hand. Still ` +
					`referenced by: ${stillReferencing.map((file) => file.getBaseName()).join(', ')}.`,
			});
		} else {
			rmSync(entitiesDirectory, { recursive: true, force: true });
			removedDirectories.push(entitiesDirectory);
		}
	}

	return {
		changedFiles: [...changed].map((file) => file.getFilePath()),
		removedDirectories,
		issues,
	};
};
