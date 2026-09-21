import type { EntityMetadata } from '@exogee/graphweaver';
import { resolveEntity } from './resolve';
import type { ResolveOptions } from './resolve';
import type { ResolvedEntity } from './types';

/**
 * Resolution is memoised per entity, for two reasons: it is on every query path, and relationships
 * are circular, so without a cache `resolveRelated` would recurse forever.
 */
const optionsByEntity = new Map<string, ResolveOptions>();
const resolved = new Map<string, ResolvedEntity>();

/**
 * Registrations waiting for their entity's name.
 *
 * A provider is built while the `@Entity` decorator's argument is being evaluated, before the class
 * binding exists, so it cannot say at that moment which entity it is for -- only how to find out
 * later. Hence the thunk.
 *
 * This is why registration is queued rather than applied. The obvious alternative, registering on
 * first use of the provider's own mapping, silently loses these options: resolving Album resolves
 * Artist as its relationship target, and if that happens before anything touches the Artist
 * provider, Artist gets cached with no options at all -- so an explicit `table: 'Artist'` is
 * dropped and queries go to whatever the naming strategy invented. Draining the queue before any
 * resolution closes that window, because by then every module has finished evaluating.
 */
const pending: { entityName: () => string; options: ResolveOptions }[] = [];

export const registerMappingOptions = (entityName: () => string, options: ResolveOptions) => {
	pending.push({ entityName, options });
};

/** Same keys, same values by reference. Enough to tell a repeat registration from a new one. */
const sameOptions = (a: ResolveOptions | undefined, b: ResolveOptions) => {
	if (!a) return false;

	const keys = Object.keys(a) as (keyof ResolveOptions)[];
	if (keys.length !== Object.keys(b).length) return false;

	return keys.every((key) => a[key] === b[key]);
};

const drainPending = () => {
	for (const { entityName, options } of pending.splice(0)) {
		const name = entityName();

		// `withColumns` builds a second provider over the same entity with the same options, so
		// this is a normal occurrence rather than a conflict -- and skipping it keeps the resolved
		// mapping, which asking for a hidden column would otherwise throw away every time.
		if (sameOptions(optionsByEntity.get(name), options)) continue;

		optionsByEntity.set(name, options);

		// Only reachable if a provider is built after something already resolved its entity, which
		// the queue is designed to prevent -- but a dynamically registered entity could do it, and
		// serving that entity from a mapping built without its own options would be worse than
		// paying to resolve it again.
		resolved.delete(name);
	}
};

export const resolveEntityCached = (entity: EntityMetadata<any, any>): ResolvedEntity => {
	drainPending();

	const existing = resolved.get(entity.name);
	if (existing) return existing;

	const result = resolveEntity(entity, optionsByEntity.get(entity.name) ?? {}, resolveEntityCached);

	resolved.set(entity.name, result);
	return result;
};

/** Only for tests, which build and tear down entity graphs repeatedly in one process. */
export const clearMappingCache = () => {
	resolved.clear();
	optionsByEntity.clear();
	pending.length = 0;
};
