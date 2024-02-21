import { SqlitePlatform, SqliteConnection } from '@mikro-orm/sqlite';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import sqlite3 from 'node-sqlite3-wasm';

class Connection extends SqliteConnection {
	public async connect() {
		this.client = this.createKnexClient(this.getPatchedWasmDialect());
		await this.client.raw('pragma foreign_keys = on');
	}
	private getPatchedWasmDialect() {
		// @ts-ignore - we need to call the private message
		const Sqlite3Dialect = this.getPatchedDialect();

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

export class SqliteDriver extends AbstractSqlDriver {
	constructor(config: any) {
		super(config, new SqlitePlatform(), Connection, ['knex', 'node-sqlite3-wasm']);
	}
}
