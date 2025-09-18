import {
	BackendProvider,
	HookParams,
	HookRegister,
	LogOnDidResolveOperationParams,
	hookManagerMap,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { ApolloError, AuthenticationError } from 'apollo-server-errors';

import { hashPassword } from '../../utils/argon2id';
import { CredentialUpdateInput, CredentialInsertInput } from './password';
import { CredentialStorage } from '../entities';
import { Kind, OperationDefinitionNode, print, stripIgnoredCharacters, visit } from 'graphql';

// Define VariableValues type based on Apollo Server's definition since we can't import it from
// Apollo Server.
type VariableValues = { [name: string]: any };

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

export type UpdatePasswordCredentialOptions = {
	assertPasswordStrength: (password: string) => boolean;
	provider: BackendProvider<CredentialStorage>;
	id: string;
	password?: string;
	username?: string;
	params?: HookParams<CredentialUpdateInput>;
};
export const updatePasswordCredential = async ({
	assertPasswordStrength,
	provider,
	id,
	password,
	username,
	params,
}: UpdatePasswordCredentialOptions) => {
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

export const runAfterHooks = async <D, H = CredentialInsertInput | CredentialUpdateInput>(
	hookRegister: HookRegister,
	entities: (D | null)[],
	hookParams?: HookParams<H>
): Promise<(D | null)[]> => {
	const hookManager = hookManagerMap.get('Credential');

	const { entities: hookEntities = [] } =
		hookManager && hookParams
			? await hookManager.runHooks(hookRegister, {
					...hookParams,
					entities,
				})
			: { entities };

	return hookEntities;
};

const obfuscateSensitiveValues = (
	variables: VariableValues | undefined,
	nodeNamesToMask: Set<string>
) => {
	try {
		if (!variables) return variables;

		const obfuscateNode = (key: string, value: any): any => {
			if (nodeNamesToMask.has(key)) {
				return '********';
			}

			if (value === null || value === undefined) {
				return value;
			}

			if (Array.isArray(value)) {
				return value.map((item: any) => obfuscateNode(key, item));
			}

			if (typeof value === 'symbol') {
				return '********'; // technically impossible, but just in case
			}

			if (typeof value === 'object') {
				return obfuscateObject(value);
			}

			return value;
		};

		const obfuscateObject = (obj: any) => {
			return Object.fromEntries(
				Object.entries(obj).map(([key, value]) => [key, obfuscateNode(key, value)])
			);
		};

		return obfuscateObject(variables);
	} catch (e) {
		logger.error(e, 'obfuscateSensitiveValues - error');
		return undefined;
	}
};

const maskSensitiveValuesForLogging = (
	ast: OperationDefinitionNode,
	variables: VariableValues | undefined,
	nodeNamesToMask: Set<string>
) => {
	logger.trace('maskSensitiveValuesForLogging - enter');
	const safeVariables = obfuscateSensitiveValues(variables, nodeNamesToMask);
	const safeAst = visit(ast, {
		enter(node) {
			if (
				(node.kind === Kind.OBJECT_FIELD || node.kind === Kind.ARGUMENT) &&
				nodeNamesToMask.has(node.name.value)
			) {
				if (node.value.kind === Kind.STRING) {
					return {
						...node,
						value: {
							...node.value,
							value: '********',
						},
					};
				}
			}
		},
	});

	return {
		query: stripIgnoredCharacters(print(safeAst)),
		variables: safeVariables,
	};
};

export const handleLogOnDidResolveOperation =
	(sensitiveFields: Set<string>) => (params: Readonly<LogOnDidResolveOperationParams>) => {
		const { query, variables } = maskSensitiveValuesForLogging(
			params.ast,
			params.variables,
			sensitiveFields
		);

		return { query, variables };
	};
