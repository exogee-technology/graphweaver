import { Entity, ID } from '@exogee/graphweaver';
import type { BackendProvider } from '@exogee/graphweaver';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import {
	ApiKeyEntity,
	Credential,
	type AuthenticationBaseEntity,
	type CredentialStorage,
} from '@exogee/graphweaver-auth';
import { Field, SqlDataProvider } from '@exogee/graphweaver-sql';
import { myConnection } from '../database';
import { Roles } from './roles';

/**
 * Where the auth package's storage lives.
 *
 * These are the entities the auth methods read and write. Two of them -- Credential and ApiKey --
 * are declared by the auth package itself, so the mapping goes on the provider rather than on the
 * class. Authentication is only an interface there, so it is declared here.
 */

/** The auth package exposes `password` on CredentialStorage but never in the API. */
export const credentialProvider = new SqlDataProvider<Credential, CredentialStorage>(
	() => Credential,
	myConnection,
	{ hidden: { id: { type: 'string' }, username: { type: 'string' }, password: { type: 'string' } } }
);

/**
 * ApiKey needs three overrides, and none of them can go on the class: it belongs to the auth
 * package.
 *
 *   - the column is `api_key`, not `key`
 *   - `secret` is deliberately not a `@Field`, so it has to be declared as a hidden column
 *   - `roles` is a list stored as a comma separated string, which is what MikroORM wrote
 */
export const apiKeyProvider = new SqlDataProvider<ApiKeyEntity<Roles>, { secret: string }>(
	() => ApiKeyEntity<Roles>,
	myConnection,
	{
		table: 'api_key',
		columns: {
			key: 'api_key',
			roles: { meta: { items: 'string', arrayEncoding: 'delimited' } },
		},
		hidden: { secret: { type: 'string' } },
	}
);

/**
 * Storage for the authentication methods -- magic links, one time passwords, passkeys, wallets.
 *
 * Excluded from the built-in operations because it is a store, not part of the API surface.
 */
const authenticationProvider = new SqlDataProvider(() => Authentication, myConnection);

@Entity<Authentication>('Authentication', {
	provider: authenticationProvider,
	apiOptions: { excludeFromBuiltInOperations: true },
})
export class Authentication {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String)
	type!: string;

	@Field(() => String, { column: 'user_id' })
	userId!: string;

	@Field(() => GraphQLJSON, { columnType: 'json' })
	data!: unknown;

	@Field(() => Date, { column: 'created_at' })
	createdAt!: Date;
}

/**
 * The authentication store, typed for one method's payload.
 *
 * One table holds every method's data in a JSON column, so the entity cannot be generic while the
 * provider it is registered with must be. The cast is contained here rather than repeated at each
 * of the six call sites.
 */
export const authenticationProviderFor = <T>() =>
	authenticationProvider as unknown as BackendProvider<AuthenticationBaseEntity<T>>;
