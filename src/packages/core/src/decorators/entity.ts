import { pluralise } from '../utils/plural';
import { CollectEntityInformationArgs, graphweaverMetadata } from '../metadata';

export type EntityOptions<G = unknown> = Partial<
	Omit<CollectEntityInformationArgs<G, any>, 'fields' | 'gqlEntityType'>
>;

export function Entity<G = unknown>(name: string): ClassDecorator;
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
		const plural = pluralise(resolvedOptions?.plural ?? name, !!resolvedOptions?.plural);

		// Let's make sure the new name is set on the target
		Object.defineProperty(target, 'name', { value: name });

		graphweaverMetadata.collectEntityInformation({
			...resolvedOptions,
			name,
			plural,
			target: target as any,
		});

		return target;
	}) as ClassDecorator;
}
