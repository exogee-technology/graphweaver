import { SqlitePlatform, SqliteConnection, Configuration } from '@mikro-orm/sqlite';
import { AbstractSqlDriver, MonkeyPatchable } from '@mikro-orm/knex';
import sqlite3 from 'node-sqlite3-wasm';

class Connection extends SqliteConnection {
	public async connect() {
		this.client = this.createKnexClient(this.getPatchedWasmDialect());
		await this.client.raw('pragma foreign_keys = on');
	}
	private getPatchedWasmDialect() {
		const { Sqlite3Dialect } = MonkeyPatchable;

		if (Sqlite3Dialect.prototype.___patched) {
			return Sqlite3Dialect;
		}

		Sqlite3Dialect.prototype.___patched = true;
		Sqlite3Dialect.prototype._driver = function () {
			return sqlite3;
		};
		Sqlite3Dialect.prototype.acquireRawConnection = function () {
			return new sqlite3.Database(this.connectionSettings.filename);
		};
		Sqlite3Dialect.prototype._query = (connection: sqlite3.Database, obj: any) => {
			if (!obj.sql) throw new Error('The query is empty');

			const { method } = obj;
			let callMethod: 'all' | 'run';
			switch (method) {
				case 'insert':
				case 'update':
					callMethod = obj.returning ? 'all' : 'run';
					break;
				case 'counter':
				case 'del':
					callMethod = 'run';
					break;
				case 'raw':
					if (obj.sql.startsWith('delete')) {
						callMethod = 'run';
					} else {
						callMethod = 'all';
					}
					break;
				default:
					callMethod = 'all';
			}
			if (!connection || !connection[callMethod]) {
				throw new Error(`Error calling ${callMethod} on connection.`);
			}

			const results = connection[callMethod](obj.sql, obj.bindings);
			return Promise.resolve({
				response: results,
				returning: obj.returning,
			});
		};
		return Sqlite3Dialect;
	}
}

export class SqliteDriver extends AbstractSqlDriver<Connection> {
	constructor(config: Configuration) {
		super(config, new SqlitePlatform(), Connection, ['knex', 'node-sqlite3-wasm']);
	}
}
