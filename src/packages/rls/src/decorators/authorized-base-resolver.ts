import {
	BaseResolverInterface,
	Hook,
	HookManager,
	HookRegister,
	ReadHookParams,
} from '@exogee/graphweaver';
import { Authorized } from 'type-graphql';
import { AuthorizationContext } from '../types';

const readOnlyFuncs = ['list', 'getOne'];
const writeFuncs = ['createItem', 'update', 'deleteItem', 'updateMany', 'createMany'];

export const AuthorizedBaseResolver = <G>() => {
	return <T extends { new (): any } & BaseResolverInterface<G>>(constructor: T): T => {
		// Access the constructor function (target) here
		console.log('Class being decorated:', constructor);

		const hookManager = constructor.prototype.hookManager || new HookManager<G>();

		const beforeRead = async (params: ReadHookParams<G, AuthorizationContext>) => {
			// You can hook into any read here and make changes such as applying a filter
			// const filter = params.args?.filter ?? {};
			// const userFilter = {
			// 	...filter,
			// 	people: {
			// 		id: params.context?.user.id,
			// 	},
			// };
			// 	...params,
			// 	args: {
			// 		...params.args,
			// 		filter: userFilter,
			// 	},
			// };
			return params;
		};

		hookManager.registerHook(HookRegister.BEFORE_READ, beforeRead);
		constructor.prototype.hookManager = hookManager;

		return constructor;
	};
};
