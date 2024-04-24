import { CollectEntityInformationArgs, graphweaverMetadata, pluralise } from '..';

export type EntityOptions<G> = Partial<
	Omit<CollectEntityInformationArgs<G, any>, 'fields' | 'gqlEntityType'>
>;

export function Entity<G>(name: string): ClassDecorator;
export function Entity<G>(options: EntityOptions<G>): ClassDecorator;
export function Entity<G>(name: string, options: EntityOptions<G>): ClassDecorator;
export function Entity<G>(nameOrOptions?: string | EntityOptions<G>, options?: EntityOptions<G>) {
	return (target: G) => {
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
			target,
		});

		return target;
	};
}
