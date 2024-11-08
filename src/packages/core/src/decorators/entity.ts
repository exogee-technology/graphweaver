import { pluralise } from '../utils/plural';
import { CollectEntityInformationArgs, graphweaverMetadata } from '../metadata';
import { HookManager, hookManagerMap, HookRegister } from '../hook-manager';
import { CreateOrUpdateHookParams, DeleteHookParams, ReadHookParams } from '../types';

const reservedEntityNames = new Set(['GraphweaverMedia']);

export type EntityOptions<G = unknown> = Partial<
	Omit<CollectEntityInformationArgs<G, any>, 'fields' | 'gqlEntityType'>
>;

export type CustomHookFunction<G> = (params: CreateOrUpdateHookParams<G> | DeleteHookParams<G> | ReadHookParams<G>) => Promise<Partial<G>> | Partial<G>;
export function Entity(name: string): ClassDecorator;
export function Entity<G = unknown>(options: EntityOptions<G>): ClassDecorator;
export function Entity<G = unknown>(name: string, options: EntityOptions<G>): ClassDecorator;
export function Entity<G = unknown>(
	nameOrOptions?: string | EntityOptions<G>,
	options?: EntityOptions<G>
) {
	return ((target: { new (...args: any[]): G }) => {
		const resolvedOptions =
			typeof nameOrOptions === 'string'
				? { ...(options ?? {}), name: nameOrOptions }
				: nameOrOptions;
		const name = resolvedOptions?.name ?? (target as any).name;

		if (!name) {
			throw new Error('Could not determine name for entity.');
		}

		if (
			!resolvedOptions?.graphweaverInternalOptions?.ignoreReservedEntityNames &&
			reservedEntityNames.has(name)
		) {
			throw new Error(
				`The entity name "${name}" is reserved for internal use by Graphweaver. Please use a different name.`
			);
		}

		const plural = pluralise(resolvedOptions?.plural ?? name, !!resolvedOptions?.plural);

		function registerHook(hookManager: HookManager<G>, hookType: HookRegister, hook: CustomHookFunction<G>) {
			hookManager.registerHook(hookType, async (params: CreateOrUpdateHookParams<G> | DeleteHookParams<G> | ReadHookParams<G>) => {
				const modifiedParams = await Promise.resolve(hook(params));
				return {
					...params,
					...modifiedParams
				};
			});
		}

		if (resolvedOptions?.hooks) {
			const hookManager = hookManagerMap.get(name) || new HookManager<G>();
			
			if (resolvedOptions.hooks.beforeCreate) {
				registerHook(hookManager, HookRegister.BEFORE_CREATE, resolvedOptions.hooks.beforeCreate as CustomHookFunction<G>);
			}

			if (resolvedOptions.hooks.afterCreate) {
				registerHook(hookManager, HookRegister.AFTER_CREATE, resolvedOptions.hooks.afterCreate as CustomHookFunction<G>);
			}

			if (resolvedOptions.hooks.beforeUpdate) {
				registerHook(hookManager, HookRegister.BEFORE_UPDATE, resolvedOptions.hooks.beforeUpdate as CustomHookFunction<G>);
			}

			if (resolvedOptions.hooks.afterUpdate) {
				registerHook(hookManager, HookRegister.AFTER_UPDATE, resolvedOptions.hooks.afterUpdate as CustomHookFunction<G>);
			}

			if (resolvedOptions.hooks.beforeDelete) {
				registerHook(hookManager, HookRegister.BEFORE_DELETE, resolvedOptions.hooks.beforeDelete as CustomHookFunction<G>);
			}

			if (resolvedOptions.hooks.afterDelete) {
				registerHook(hookManager, HookRegister.AFTER_DELETE, resolvedOptions.hooks.afterDelete as CustomHookFunction<G>);
			}

			if (resolvedOptions.hooks.beforeRead) {
				registerHook(hookManager, HookRegister.BEFORE_READ, resolvedOptions.hooks.beforeRead as CustomHookFunction<G>);
			}

			if (resolvedOptions.hooks.afterRead) {
				registerHook(hookManager, HookRegister.AFTER_READ, resolvedOptions.hooks.afterRead as CustomHookFunction<G>);
			}
			
			hookManagerMap.set(name, hookManager);
		}

		// Let's make sure the new name is set on the target
		Object.defineProperty(target, 'name', { value: name });
		// Lets also set the __typename on the prototype for resolving union types
		Object.defineProperty(target.prototype, '__typename', { value: name });

		graphweaverMetadata.collectEntityInformation({
			...resolvedOptions,
			name,
			plural,
			target: target as any,
		});

		return target;
	}) as ClassDecorator;
}
