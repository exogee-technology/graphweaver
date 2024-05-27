import {
	BackendProvider,
	BaseDataEntity,
	GraphQLResolveInfo,
	HookParams,
	HookRegister,
	hookManagerMap,
} from '@exogee/graphweaver';
import { ApolloError, AuthenticationError } from 'apollo-server-errors';

import { hashPassword } from '../../utils/argon2id';
import { CredentialUpdateInput, CredentialInsertInput } from './password';

export class PasswordStrengthError extends ApolloError {
	constructor(message: string, extensions?: Record<string, any>) {
		super(message, 'WEAK_PASSWORD', extensions);

		Object.defineProperty(this, 'name', { value: 'WeakPasswordError' });
	}
}

export const defaultPasswordStrength = (password?: string) => {
	// Default password strength check is 8 characters or more
	if (password && password.length > 7) return true;
	throw new PasswordStrengthError('Password not strong enough.');
};

export type updatePasswordCredentialOptions<D> = {
	assertPasswordStrength: (password: string) => boolean;
	provider: BackendProvider<D, any>;
	id: string;
	password?: string;
	username?: string;
	params?: HookParams<CredentialUpdateInput>;
};
export const updatePasswordCredential = async <D extends BaseDataEntity>({
	assertPasswordStrength,
	provider,
	id,
	password,
	username,
	params,
}: updatePasswordCredentialOptions<D>) => {
	let passwordHash = undefined;
	if (password && assertPasswordStrength(password)) {
		passwordHash = await hashPassword(password);
	}
	const credential = await provider.updateOne(id, {
		...(username ? { username } : {}),
		...(passwordHash ? { password: passwordHash } : {}),
	});

	const [entity] = await runAfterHooks(HookRegister.AFTER_UPDATE, [credential], params);
	if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');
	return entity;
};

export const runAfterHooks = async <
	D extends BaseDataEntity,
	H = CredentialInsertInput | CredentialUpdateInput,
>(
	hookRegister: HookRegister,
	entities: (D | null)[],
	info: GraphQLResolveInfo,
	hookParams?: HookParams<H>
): Promise<(D | null)[]> => {
	const hookManager = hookManagerMap.get('Credential');

	const { entities: hookEntities = [] } =
		hookManager && hookParams
			? await hookManager.runHooks(
					hookRegister,
					{
						...hookParams,
						entities,
					},
					info
				)
			: { entities };

	return hookEntities;
};
