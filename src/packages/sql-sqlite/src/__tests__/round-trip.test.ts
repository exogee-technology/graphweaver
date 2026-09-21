import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import gql from 'graphql-tag';
import { Database } from 'node-sqlite3-wasm';
import * as GraphweaverServer from '@exogee/graphweaver-server';
import { sqliteIntrospector } from '@exogee/graphweaver-sql/lib/introspection';
import { generateFiles } from '@exogee/graphweaver-sql/lib/codegen';
import { SEED_STATEMENTS } from '@exogee/graphweaver-sql/lib/testing';
import { ddl } from './ddl';

/**
 * The whole loop: create a database, read it back, generate entity files from what we read, write
 * them to disk, import them, and serve a GraphQL query through them.
 *
 * Nothing here is hand-written except the schema itself. If the generated code does not compile,
 * or maps a column wrongly, or misses a relationship, this fails -- which is a much stronger claim
 * than a snapshot of the generated text.
 */
describe('introspect, generate, run', () => {
	const generatedDir = join(__dirname, '.generated');
	const databaseFile = join(generatedDir, 'round-trip.sqlite');

	let typeCheckResult = '';
	let data: { albums: { title: string; artist: { name: string } | null }[] };
	let genreData: { genres: { name: string; tracks: { name: string }[] }[] };

	beforeAll(async () => {
		rmSync(generatedDir, { recursive: true, force: true });
		mkdirSync(generatedDir, { recursive: true });

		// A real file, because the generated database.ts opens the database by name.
		const database = new Database(databaseFile);
		for (const statement of ddl) database.exec(statement);
		for (const statement of SEED_STATEMENTS) database.exec(statement);

		const schema = await sqliteIntrospector.introspect(
			async (sql) => database.all(sql) as Record<string, unknown>[]
		);
		database.close();

		const { files, errors } = generateFiles({
			schema,
			dialect: 'sqlite',
			connectionId: 'round-trip',
			connection: { filename: databaseFile },
		});

		expect(errors).toEqual([]);

		for (const file of files) {
			// Written exactly as generated. The package self-links in devDependencies so that
			// `@exogee/graphweaver-sql-sqlite` resolves here the way it would in a real project,
			// which means this tests the emitted code rather than a doctored copy of it.
			const target = join(generatedDir, file.path);
			mkdirSync(dirname(target), { recursive: true });
			writeFileSync(target, file.contents);
		}

		// Typecheck what was generated before running it.
		//
		// Vitest transpiles TypeScript without checking it, so a generated file can import a
		// property that does not exist on the option type and still run perfectly -- which is
		// exactly how a bad `namingStrategy` emit got through once. Running tsc over the output is
		// what makes "the generated code compiles" an actual claim.
		writeFileSync(
			join(generatedDir, 'tsconfig.json'),
			JSON.stringify(
				{
					// The repo root config, not the package one: that excludes this directory, and
					// `exclude` resolves relative to whichever config declares it. Absolute,
					// because this file is written at test time and never committed, so there is
					// nothing to be gained from a relative path that has to be counted correctly.
					extends: join(__dirname, '..', '..', '..', '..', 'tsconfig.json'),
					// No rootDir: nothing is emitted, and the generated files legitimately import
					// packages from outside this directory.
					compilerOptions: {
						noEmit: true,
						composite: false,
						// The root config sets a rootDir that this directory is not under, and the
						// mapping below deliberately reaches back into the package source.
						rootDir: join(__dirname, '..', '..'),
						// The generated code imports this package by its published name, which a
						// package cannot resolve from inside itself. vitest has an alias for the
						// runtime side; tsc needs the same mapping to typecheck it.
						paths: {
							'@exogee/graphweaver-sql-sqlite': [join(__dirname, '..', 'index.ts')],
						},
					},
					include: ['./backend/**/*.ts'],
					exclude: [],
				},
				null,
				'\t'
			)
		);

		typeCheckResult = (() => {
			try {
				execFileSync('npx', ['tsc', '--noEmit', '-p', join(generatedDir, 'tsconfig.json')], {
					cwd: join(__dirname, '..', '..'),
					stdio: 'pipe',
				});
				return '';
			} catch (error) {
				const failure = error as { stdout?: Buffer; stderr?: Buffer };
				return `${failure.stdout?.toString() ?? ''}${failure.stderr?.toString() ?? ''}`;
			}
		})();

		// Importing the barrel registers every generated entity with Graphweaver.
		await import('./.generated/backend/schema/index');

		const resolveDefault = (value: unknown): any => {
			let current: any = value;
			while (current && typeof current !== 'function' && 'default' in current) {
				current = current.default;
			}
			return current;
		};

		const Graphweaver = resolveDefault(GraphweaverServer) as new () => {
			executeOperation(request: { query: unknown }): Promise<any>;
		};
		const graphweaver = new Graphweaver();

		const { connection } = await import('./.generated/backend/database');
		await connection.connect();

		const albumResponse = await graphweaver.executeOperation({
			query: gql`
				query {
					albums {
						title
						artist {
							name
						}
					}
				}
			`,
		});
		expect(albumResponse.body.singleResult.errors).toBeUndefined();
		data = albumResponse.body.singleResult.data;

		const genreResponse = await graphweaver.executeOperation({
			query: gql`
				query {
					genres {
						name
						tracks {
							name
						}
					}
				}
			`,
		});
		expect(genreResponse.body.singleResult.errors).toBeUndefined();
		genreData = genreResponse.body.singleResult.data;
	});

	it('generates code that compiles', () => {
		expect(typeCheckResult).toBe('');
	});

	it('serves rows through entities nobody wrote by hand', () => {
		expect(data.albums.map((album) => album.title)).toEqual([
			'Jagged Little Pill',
			'OK Computer',
			'Orphan Album',
		]);
	});

	it('resolves a generated many-to-one, including the nullable case', () => {
		expect(data.albums).toEqual([
			{ title: 'Jagged Little Pill', artist: { name: 'Alanis Morissette' } },
			{ title: 'OK Computer', artist: { name: 'Radiohead' } },
			{ title: 'Orphan Album', artist: null },
		]);
	});

	it('resolves a generated many-to-many across the generated pivot', () => {
		const byGenre = Object.fromEntries(
			genreData.genres.map((genre) => [genre.name, genre.tracks.map((t) => t.name).sort()])
		);

		expect(byGenre['Rock']).toEqual(['Ironic', 'Paranoid Android', 'You Oughta Know']);
		expect(byGenre['Alternative']).toEqual(['Karma Police', 'Paranoid Android']);
	});
});
