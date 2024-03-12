import {
	BackendProvider,
	BaseDataEntity,
	HookParams,
	HookRegister,
	hookManagerMap,
} from '@exogee/graphweaver';
import { ApolloError, AuthenticationError } from 'apollo-server-errors';

import { hashPassword } from '../../utils/argon2id';
import { CredentialCreateOrUpdateInputArgs } from './password';

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

export const updatePassword = async <D extends BaseDataEntity>(
	assertPasswordStrength: (password: string) => boolean,
	provider: BackendProvider<D, any>,
	id: string,
	password?: string,
	params?: HookParams<CredentialCreateOrUpdateInputArgs>
) => {
	let passwordHash = undefined;
	if (password && assertPasswordStrength(password)) {
		passwordHash = await hashPassword(password);
	}
	const credential = await provider.updateOne(id, {
		...(passwordHash ? { password: passwordHash } : {}),
	});

	const [entity] = await runAfterHooks(HookRegister.AFTER_UPDATE, [credential], params);
	if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');
	return entity;
};

export const runAfterHooks = async <
	D extends BaseDataEntity,
	H extends HookParams<CredentialCreateOrUpdateInputArgs>
>(
	hookRegister: HookRegister,
	entities: (D | null)[],
	hookParams?: H
): Promise<((D & { id: string }) | null)[]> => {
	const hookManager = hookManagerMap.get('Credential');

	const { entities: hookEntities = [] } =
		hookManager && hookParams
			? await hookManager.runHooks(hookRegister, {
					...hookParams,
					entities,
			  })
			: { entities };

	return hookEntities as ((D & { id: string }) | null)[];
};
