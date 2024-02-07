import {
	BackendProvider,
	BaseDataEntity,
	HookParams,
	HookRegister,
	hookManagerMap,
} from '@exogee/graphweaver';
import { hashPassword } from '../../utils/argon2id';
import { AuthenticationError } from 'apollo-server-errors';
import { CredentialCreateOrUpdateInputArgs } from './password';

export const updatePassword = async <D extends BaseDataEntity>(
	assertPasswordStrength: (password: string) => boolean,
	provider: BackendProvider<D, any>,
	id: string,
	password?: string,
	username?: string,
	params?: HookParams<CredentialCreateOrUpdateInputArgs>
) => {
	let passwordHash = undefined;
	if (password && assertPasswordStrength(password)) {
		passwordHash = await hashPassword(password);
	}
	const credential = await provider.updateOne(id, {
		...(username ? { username: username } : {}),
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
