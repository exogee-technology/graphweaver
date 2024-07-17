import { pluralise } from '../utils/plural';
import { CollectEntityInformationArgs, graphweaverMetadata } from '../metadata';

const reservedEntityNames = new Set(['GraphweaverMedia']);

export type EntityOptions<G = unknown> = Partial<
	Omit<CollectEntityInformationArgs<G, any>, 'fields' | 'gqlEntityType'>
>;

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

		if (!resolvedOptions?.__INTERNAL_ignoreReservedEntityNames && reservedEntityNames.has(name)) {
			throw new Error(
				`The entity name "${name}" is reserved for internal use by Graphweaver. Please use a different name.`
			);
		}

		const plural = pluralise(resolvedOptions?.plural ?? name, !!resolvedOptions?.plural);

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
