import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

import { driverOptionsForSsl, readCertificate } from './ssl';

const CERTIFICATE =
	'-----BEGIN CERTIFICATE-----\nnot-a-real-certificate\n-----END CERTIFICATE-----';

const writeCertificateToDisk = (name: string, contents = CERTIFICATE) => {
	const file = path.join(mkdtempSync(path.join(tmpdir(), 'graphweaver-ssl-')), name);
	writeFileSync(file, contents);
	return file;
};

describe('readCertificate', () => {
	it('should pass PEM encoded certificates straight through', () => {
		expect(readCertificate(CERTIFICATE)).toBe(CERTIFICATE);
	});

	it('should read certificates that are given to us as a path', () => {
		expect(readCertificate(writeCertificateToDisk('ca.pem'))).toBe(CERTIFICATE);
	});

	it('should tell the developer which certificate file it could not find', () => {
		expect(() => readCertificate('/does/not/exist.pem')).toThrow('/does/not/exist.pem');
	});
});

describe('driverOptionsForSsl', () => {
	it('should not configure SSL when the developer has not asked for it', () => {
		expect(driverOptionsForSsl('postgresql', undefined)).toBeUndefined();
		expect(driverOptionsForSsl('postgresql', false)).toBeUndefined();
	});

	it('should ignore SSL options for SQLite, which has no connection to secure', () => {
		expect(driverOptionsForSsl('sqlite', true)).toBeUndefined();
	});

	it('should turn SSL on with the system certificate authorities', () => {
		expect(driverOptionsForSsl('postgresql', true)).toEqual({ connection: { ssl: true } });
		expect(driverOptionsForSsl('mysql', true)).toEqual({ connection: { ssl: true } });
	});

	it('should read certificates from disk before handing them to the driver', () => {
		const ca = writeCertificateToDisk('ca.pem');

		expect(driverOptionsForSsl('postgresql', { ca })).toEqual({
			connection: { ssl: { ca: CERTIFICATE } },
		});
	});

	it('should accept more than one certificate authority', () => {
		const ca = writeCertificateToDisk('ca.pem');

		expect(driverOptionsForSsl('postgresql', { ca: [ca, CERTIFICATE] })).toEqual({
			connection: { ssl: { ca: [CERTIFICATE, CERTIFICATE] } },
		});
	});

	it('should pass client certificates and their key through', () => {
		expect(
			driverOptionsForSsl('mysql', {
				cert: CERTIFICATE,
				key: CERTIFICATE,
				passphrase: 'hunter2',
				rejectUnauthorized: false,
			})
		).toEqual({
			connection: {
				ssl: {
					cert: CERTIFICATE,
					key: CERTIFICATE,
					passphrase: 'hunter2',
					rejectUnauthorized: false,
				},
			},
		});
	});

	it('should configure TLS the way Tedious expects it for SQL Server', () => {
		expect(driverOptionsForSsl('mssql', true)).toEqual({
			connection: { options: { encrypt: true } },
		});

		expect(driverOptionsForSsl('mssql', { ca: CERTIFICATE, rejectUnauthorized: false })).toEqual({
			connection: {
				options: {
					encrypt: true,
					trustServerCertificate: true,
					cryptoCredentialsDetails: { ca: CERTIFICATE },
				},
			},
		});
	});

	it('should let the caller decide what to do with certificates', () => {
		expect(
			driverOptionsForSsl('postgresql', { ca: 'certs/ca.pem' }, (value) => `read(${value})`)
		).toEqual({ connection: { ssl: { ca: 'read(certs/ca.pem)' } } });
	});
});
