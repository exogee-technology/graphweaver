import { describe, it, expect } from 'vitest';

import { DatabaseFile } from './files/database-file';

const CERTIFICATE =
	'-----BEGIN CERTIFICATE-----\nnot-a-real-certificate\n-----END CERTIFICATE-----';

const mikroOrmConfig = {
	host: 'db.example.com',
	dbName: 'graphweaver',
	user: 'postgres',
	password: 'password',
	port: 5432,
};

describe('DatabaseFile', () => {
	it('should not write any driver options when SSL is not in use', () => {
		const file = new DatabaseFile('postgresql', { mikroOrmConfig }).generate();

		expect(file).not.toContain('driverOptions');
		expect(file).not.toContain('ssl');
	});

	it('should turn SSL on in the generated project', () => {
		const file = new DatabaseFile('postgresql', { mikroOrmConfig, ssl: true }).generate();

		expect(file).toContain(`driverOptions: {
			connection: {
				ssl: true,
			},
		},`);
	});

	it('should read a certificate the developer gave us a path to at runtime', () => {
		const file = new DatabaseFile('postgresql', {
			mikroOrmConfig,
			ssl: { ca: 'certs/rds-ca.pem', rejectUnauthorized: false },
		}).generate();

		expect(file).toContain(`import { readFileSync } from 'node:fs';`);
		expect(file).toContain(`ca: readFileSync('certs/rds-ca.pem', 'utf-8'),`);
		expect(file).toContain(`rejectUnauthorized: false,`);
	});

	it('should inline a certificate the developer gave us the contents of', () => {
		const file = new DatabaseFile('postgresql', {
			mikroOrmConfig,
			ssl: { ca: CERTIFICATE },
		}).generate();

		expect(file).not.toContain('readFileSync');
		expect(file).toContain(`ca: ${JSON.stringify(CERTIFICATE)},`);
	});

	it('should configure SQL Server connections the way Tedious expects', () => {
		const file = new DatabaseFile('mssql', { mikroOrmConfig, ssl: true }).generate();

		expect(file).toContain(`driverOptions: {
			connection: {
				options: {
					encrypt: true,
				},
			},
		},`);
	});
});
