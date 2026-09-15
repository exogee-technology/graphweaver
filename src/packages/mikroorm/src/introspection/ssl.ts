import { existsSync, readFileSync } from 'node:fs';

import { DatabaseType } from '../database';

/**
 * SSL options for a database connection.
 *
 * Certificates and keys can be given either as a path to a file on disk or as the PEM encoded
 * contents of the certificate itself, whichever is more convenient.
 */
export interface DatabaseSslOptions {
	/** The certificate authority (or authorities) to trust when connecting. */
	ca?: string | string[];

	/** The client certificate to present to the server, if it requires one. */
	cert?: string;

	/** The private key for the client certificate above. */
	key?: string;

	/** The passphrase for the private key above, if it is encrypted. */
	passphrase?: string;

	/** Defaults to true. Set to false to accept certificates the CAs above don't vouch for. */
	rejectUnauthorized?: boolean;
}

/**
 * `true` connects with SSL using the system certificate authorities, an object lets you pass
 * certificates and other options, and `false` (the default) connects without SSL.
 */
export type DatabaseSsl = boolean | DatabaseSslOptions;

// PEM encoded certificates always carry this header, so anything without it is a path to a file.
const isPemEncodedCertificate = (value: string) => value.includes('-----BEGIN');

/**
 * Certificates can be given to us as either a path to a file or the contents of the file itself.
 * This reads the former from disk and passes the latter straight back.
 */
export const readCertificate = (certificateOrPath: string) => {
	if (isPemEncodedCertificate(certificateOrPath)) return certificateOrPath;

	if (!existsSync(certificateOrPath)) {
		throw new Error(
			`Could not find the certificate file '${certificateOrPath}'. Please check the path and try again.`
		);
	}

	return readFileSync(certificateOrPath, 'utf-8');
};

const transformCertificates = (
	ssl: DatabaseSslOptions,
	transformCertificate: (certificateOrPath: string) => unknown
) => ({
	...ssl,
	...(ssl.ca
		? {
				ca: Array.isArray(ssl.ca) ? ssl.ca.map(transformCertificate) : transformCertificate(ssl.ca),
			}
		: {}),
	...(ssl.cert ? { cert: transformCertificate(ssl.cert) } : {}),
	...(ssl.key ? { key: transformCertificate(ssl.key) } : {}),
});

/**
 * Each driver wants SSL configured in a slightly different place, so this maps our options onto
 * the shape the driver for `databaseType` expects, ready to drop into Mikro ORM's `driverOptions`.
 *
 * By default certificates are read from disk so the result can be handed straight to the driver.
 * Pass `transformCertificate` to keep them as something else, which is how the generated
 * `database.ts` ends up with a `readFileSync` call in it instead of an inlined certificate.
 */
export const driverOptionsForSsl = (
	databaseType: DatabaseType,
	ssl?: DatabaseSsl,
	transformCertificate: (certificateOrPath: string) => unknown = readCertificate
) => {
	// SQLite talks to a file on disk, so there's no connection to secure.
	if (!ssl || databaseType === 'sqlite') return undefined;

	const options = ssl === true ? {} : transformCertificates(ssl, transformCertificate);

	if (databaseType === 'mssql') {
		// Tedious doesn't understand an `ssl` object, it configures TLS on the connection options
		// instead, with anything certificate related nested under `cryptoCredentialsDetails`.
		const { rejectUnauthorized, ...cryptoCredentialsDetails } = options;

		return {
			connection: {
				options: {
					encrypt: true,
					...(rejectUnauthorized === false ? { trustServerCertificate: true } : {}),
					...(Object.keys(cryptoCredentialsDetails).length ? { cryptoCredentialsDetails } : {}),
				},
			},
		};
	}

	// Both `pg` and `mysql2` take a `ssl` key on the connection, where `true` means "use the
	// defaults" and an object (even an empty one) turns SSL on with those options.
	return { connection: { ssl: ssl === true ? true : options } };
};
