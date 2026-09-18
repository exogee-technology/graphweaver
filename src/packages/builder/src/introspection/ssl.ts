import { existsSync, readFileSync } from 'node:fs';
import type { DatabaseSsl, DatabaseSslOptions } from '../auth';

/**
 * Certificates arrive either as a path or as the PEM itself. Carried over unchanged from the
 * MikroORM importer, where this was added along with the SSL flags.
 */
const isPem = (value: string) => value.includes('-----BEGIN');

export const readCertificate = (certificateOrPath: string) => {
	if (isPem(certificateOrPath)) return certificateOrPath;

	if (!existsSync(certificateOrPath)) {
		throw new Error(
			`Could not find the certificate file '${certificateOrPath}'. Please check the path and try again.`
		);
	}

	return readFileSync(certificateOrPath, 'utf-8');
};

const transformCertificates = (
	ssl: DatabaseSslOptions,
	transform: (certificateOrPath: string) => unknown
) => ({
	...ssl,
	...(ssl.ca ? { ca: Array.isArray(ssl.ca) ? ssl.ca.map(transform) : transform(ssl.ca) } : {}),
	...(ssl.cert ? { cert: transform(ssl.cert) } : {}),
	...(ssl.key ? { key: transform(ssl.key) } : {}),
});

/**
 * Maps our SSL options onto whatever each driver wants.
 *
 * `pg` and `mysql2` both take an `ssl` key; `tedious` configures TLS on its connection options
 * instead, with anything certificate related nested under `cryptoCredentialsDetails`. SQLite talks
 * to a file, so there is no connection to secure.
 */
export const sslOptionsForDialect = (
	dialect: 'postgres' | 'mysql' | 'sqlite' | 'mssql',
	ssl?: DatabaseSsl,
	transform: (certificateOrPath: string) => unknown = readCertificate
): Record<string, unknown> | undefined => {
	if (!ssl || dialect === 'sqlite') return undefined;

	const options = ssl === true ? {} : transformCertificates(ssl, transform);

	if (dialect === 'mssql') {
		const { rejectUnauthorized, ...cryptoCredentialsDetails } = options as Record<string, unknown>;

		return {
			encrypt: true,
			...(rejectUnauthorized === false ? { trustServerCertificate: true } : {}),
			...(Object.keys(cryptoCredentialsDetails).length
				? { options: { cryptoCredentialsDetails } }
				: {}),
		};
	}

	return { ssl: ssl === true ? true : options };
};
