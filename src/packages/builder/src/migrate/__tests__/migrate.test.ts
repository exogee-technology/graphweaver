import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrateToSqlProvider } from '../index';

/**
 * The codemod rewrites people's source in place, so these check the shape of what comes out rather
 * than just that it ran. Each case is a minimal project written to a temporary directory.
 */
describe('migrateToSqlProvider', () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), 'gw-migrate-'));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	const write = (relative: string, contents: string) => {
		const target = join(root, relative);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, contents);
	};

	const read = (relative: string) => readFileSync(join(root, relative), 'utf-8');

	const database = `
		import { PostgreSqlDriver } from '@mikro-orm/postgresql';
		import { entities } from './entities';

		export const connection = {
			connectionManagerId: 'pg',
			mikroOrmConfig: {
				entities,
				driver: PostgreSqlDriver,
				dbName: 'chinook',
				host: 'localhost',
				port: 5432,
				user: 'postgres',
			},
		};
	`;

	it('rewrites the provider and the connection', async () => {
		write('src/backend/database.ts', database);
		write(
			'src/backend/entities/album.ts',
			`
			import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

			@Entity({ tableName: 'Album' })
			export class Album {
				@PrimaryKey({ fieldName: 'AlbumId' })
				albumId!: number;

				@Property({ fieldName: 'Title' })
				title!: string;
			}
		`
		);
		write(
			'src/backend/schema/album.ts',
			`
			import { Entity, Field, ID } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { Album as OrmAlbum } from '../entities/album';
			import { connection } from '../database';

			@Entity<Album>('Album', {
				provider: new MikroBackendProvider(OrmAlbum, connection),
			})
			export class Album {
				@Field(() => ID, { primaryKeyField: true })
				albumId!: number;

				@Field(() => String)
				title!: string;
			}
		`
		);

		const result = await migrateToSqlProvider({ cwd: root });
		const album = read('src/backend/schema/album.ts');

		expect(album).toContain('new SqlDataProvider(() => Album, connection');
		expect(album).toContain("table: 'Album'");
		// Column overrides only where convention would get it wrong, and still spelled `@Field` --
		// the SQL package's one, which is core's plus `column:`.
		expect(album).toContain("@Field(() => ID, { column: 'AlbumId', primaryKeyField: true })");
		expect(album).toMatch(/import \{[^}]*\bField\b[^}]*\} from '@exogee\/graphweaver-sql'/);
		// Two `Field` imports in one file would not compile, so core's has to go.
		expect(album).not.toMatch(/import \{[^}]*\bField\b[^}]*\} from '@exogee\/graphweaver'/);
		expect(album).not.toContain('MikroBackendProvider');

		const databaseFile = read('src/backend/database.ts');
		expect(databaseFile).toContain('defineConnection');
		expect(databaseFile).toContain("postgres({ database: 'chinook'");
		expect(databaseFile).not.toContain('mikroOrmConfig');

		expect(result.issues).toHaveLength(0);
	});

	it('leaves a field alone when the naming convention already produces its column', async () => {
		write('src/backend/database.ts', database);
		write(
			'src/backend/entities/task.ts',
			`
			import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

			@Entity()
			export class Task {
				@PrimaryKey()
				id!: string;

				@Property()
				dueAt!: Date;
			}
		`
		);
		write(
			'src/backend/schema/task.ts',
			`
			import { Entity, Field, ID } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { Task as OrmTask } from '../entities/task';
			import { connection } from '../database';

			@Entity<Task>('Task', { provider: new MikroBackendProvider(OrmTask, connection) })
			export class Task {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;

				@Field(() => Date)
				dueAt!: Date;
			}
		`
		);

		await migrateToSqlProvider({ cwd: root });
		const task = read('src/backend/schema/task.ts');

		// due_at comes from dueAt by convention, so a plain @Field still says everything needed --
		// and with no override anywhere in the file it stays core's `Field`, untouched.
		expect(task).toContain('@Field(() => Date)');
		expect(task).not.toContain('column:');
		expect(task).not.toContain('table:');
	});

	/** A second entity on the same connection, so relationships have somewhere real to point. */
	const writeUser = () => {
		write(
			'src/backend/entities/user.ts',
			`
			import { Entity, PrimaryKey } from '@mikro-orm/core';

			@Entity()
			export class User {
				@PrimaryKey()
				id!: string;
			}
		`
		);
		write(
			'src/backend/schema/user.ts',
			`
			import { Entity, Field, ID } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { User as OrmUser } from '../entities/user';
			import { connection } from '../database';

			@Entity<User>('User', { provider: new MikroBackendProvider(OrmUser, connection) })
			export class User {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;
			}
		`
		);
	};

	it('turns the ExternalIdField pattern into a many-to-one', async () => {
		write('src/backend/database.ts', database);
		writeUser();
		write(
			'src/backend/entities/task.ts',
			`
			import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

			@Entity()
			export class Task {
				@PrimaryKey()
				id!: string;

				@Property({ fieldName: 'user_id' })
				userId!: string;
			}
		`
		);
		write(
			'src/backend/schema/task.ts',
			`
			import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { Task as OrmTask } from '../entities/task';
			import { User } from './user';
			import { connection } from '../database';

			@Entity<Task>('Task', { provider: new MikroBackendProvider(OrmTask, connection) })
			export class Task {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;

				@RelationshipField<OrmTask>(() => User, { id: (entity) => entity.userId })
				user!: User;
			}
		`
		);

		await migrateToSqlProvider({ cwd: root });
		const task = read('src/backend/schema/task.ts');

		expect(task).toContain("@ManyToOne(() => User, { column: 'user_id' })");
		// The scalar became the relationship's key, so it is not also a hidden column.
		expect(task).not.toContain('hidden:');
	});

	it('leaves a relationship alone when the other end is not moving to the SQL provider', async () => {
		write('src/backend/database.ts', database);
		write(
			'src/backend/entities/task.ts',
			`
			import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

			@Entity()
			export class Task {
				@PrimaryKey()
				id!: string;

				@Property({ fieldName: 'user_id' })
				userId!: string;
			}
		`
		);
		// User is served by a REST provider, so it has no table and no MikroORM entity.
		write(
			'src/backend/schema/user.ts',
			`
			import { Entity, Field, ID } from '@exogee/graphweaver';
			import { RestBackendProvider } from '@exogee/graphweaver-rest';

			@Entity<User>('User', { provider: new RestBackendProvider('users') })
			export class User {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;
			}
		`
		);
		write(
			'src/backend/schema/task.ts',
			`
			import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { Task as OrmTask } from '../entities/task';
			import { User } from './user';
			import { connection } from '../database';

			@Entity<Task>('Task', { provider: new MikroBackendProvider(OrmTask, connection) })
			export class Task {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;

				@RelationshipField<OrmTask>(() => User, { id: 'userId' })
				user!: User;
			}
		`
		);

		const result = await migrateToSqlProvider({ cwd: root });
		const task = read('src/backend/schema/task.ts');

		// Converting this would have the SQL provider trying to map an entity with no table.
		expect(task).toContain('@RelationshipField');
		expect(task).not.toContain('@ManyToOne');
		expect(
			result.issues.some((issue) => issue.message.includes('not backed by this database'))
		).toBe(true);
	});

	it('moves a column with no API counterpart into the hidden map', async () => {
		write('src/backend/database.ts', database);
		write(
			'src/backend/entities/user.ts',
			`
			import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

			@Entity({ tableName: 'app_user' })
			export class User {
				@PrimaryKey()
				id!: string;

				@Property()
				username!: string;

				@Property({ fieldName: 'password_hash' })
				passwordHash!: string;
			}
		`
		);
		write(
			'src/backend/schema/user.ts',
			`
			import { Entity, Field, ID } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { User as OrmUser } from '../entities/user';
			import { connection } from '../database';

			@Entity<User>('User', { provider: new MikroBackendProvider(OrmUser, connection) })
			export class User {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;

				@Field(() => String)
				username!: string;
			}
		`
		);

		const result = await migrateToSqlProvider({ cwd: root });
		const user = read('src/backend/schema/user.ts');

		expect(user).toContain('export interface UserStorage');
		expect(user).toContain('passwordHash: string');
		expect(user).toContain('SqlDataProvider<User, UserStorage>');
		expect(user).toContain("passwordHash: { type: 'string', column: 'password_hash' }");
		expect(result.issues.some((issue) => issue.message.includes('hidden'))).toBe(true);
	});

	it('reports rather than guesses when something has no equivalent', async () => {
		write('src/backend/database.ts', database);
		write(
			'src/backend/entities/note.ts',
			`
			import { Entity, PrimaryKey, OneToOne } from '@mikro-orm/core';

			@Entity()
			export class Note {
				@PrimaryKey()
				id!: string;

				@OneToOne({ entity: () => Note })
				other!: Note;
			}
		`
		);
		write(
			'src/backend/schema/note.ts',
			`
			import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { Note as OrmNote } from '../entities/note';
			import { connection } from '../database';

			@Entity<Note>('Note', { provider: new MikroBackendProvider(OrmNote, connection) })
			export class Note {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;

				@RelationshipField<OrmNote>(() => Note, { id: (entity) => entity.other })
				other!: Note;
			}
		`
		);

		const result = await migrateToSqlProvider({ cwd: root });

		expect(result.issues.some((issue) => issue.message.includes('@OneToOne'))).toBe(true);
		// Left in place with a marker rather than rewritten into a guess.
		expect(read('src/backend/schema/note.ts')).toContain('TODO(graphweaver)');
	});

	it('keeps the entities directory when something outside it still imports from there', async () => {
		write('src/backend/database.ts', database);
		write('src/backend/entities/shared.ts', `export enum Status { Active = 'active' }`);
		write(
			'src/backend/entities/thing.ts',
			`
			import { Entity, PrimaryKey } from '@mikro-orm/core';

			@Entity()
			export class Thing {
				@PrimaryKey()
				id!: string;
			}
		`
		);
		write(
			'src/backend/schema/thing.ts',
			`
			import { Entity, Field, ID } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { Thing as OrmThing } from '../entities/thing';
			import { Status } from '../entities/shared';
			import { connection } from '../database';

			export const status = Status.Active;

			@Entity<Thing>('Thing', { provider: new MikroBackendProvider(OrmThing, connection) })
			export class Thing {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;
			}
		`
		);

		const result = await migrateToSqlProvider({ cwd: root });

		// Deleting it would break the enum import, which is a miserable thing to debug.
		expect(existsSync(join(root, 'src/backend/entities'))).toBe(true);
		expect(result.removedDirectories).toHaveLength(0);
		expect(result.issues.some((issue) => issue.message.includes('Kept src/backend/entities'))).toBe(
			true
		);
	});

	it('changes nothing on a dry run', async () => {
		write('src/backend/database.ts', database);
		write(
			'src/backend/entities/thing.ts',
			`
			import { Entity, PrimaryKey } from '@mikro-orm/core';

			@Entity()
			export class Thing {
				@PrimaryKey()
				id!: string;
			}
		`
		);
		const original = `
			import { Entity, Field, ID } from '@exogee/graphweaver';
			import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
			import { Thing as OrmThing } from '../entities/thing';
			import { connection } from '../database';

			@Entity<Thing>('Thing', { provider: new MikroBackendProvider(OrmThing, connection) })
			export class Thing {
				@Field(() => ID, { primaryKeyField: true })
				id!: string;
			}
		`;
		write('src/backend/schema/thing.ts', original);

		const result = await migrateToSqlProvider({ cwd: root, dryRun: true });

		expect(result.changedFiles.length).toBeGreaterThan(0);
		expect(read('src/backend/schema/thing.ts')).toBe(original);
		expect(existsSync(join(root, 'src/backend/entities'))).toBe(true);
	});
});
