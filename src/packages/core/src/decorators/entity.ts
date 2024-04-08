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
			options ?? (typeof nameOrOptions === 'string' ? { name: nameOrOptions } : nameOrOptions);
		const name = resolvedOptions?.name ?? (target as any).name;

		if (!name) {
			throw new Error('Could not determine name for entity.');
		}
		const plural = pluralise(resolvedOptions?.plural ?? name, !!resolvedOptions?.plural);

		graphweaverMetadata.collectEntityInformation({
			...resolvedOptions,
			name,
			plural,
			target,
		});

		return target;
	};
}
