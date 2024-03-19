import { CollectEntityInformationArgs, graphweaverMetadata, pluralise } from '..';

export type EntityOptions = Partial<
	Omit<CollectEntityInformationArgs<unknown, any>, 'fields' | 'gqlEntityType'>
>;

export function Entity(name: string): ClassDecorator;
export function Entity(options: EntityOptions): ClassDecorator;
export function Entity(nameOrOptions?: string | EntityOptions) {
	return <G>(target: G) => {
		const options = typeof nameOrOptions === 'string' ? { name: nameOrOptions } : nameOrOptions;
		const name = options?.name ?? (target as any).name;

		if (!name) {
			throw new Error('Could not determine name for entity.');
		}
		const plural = pluralise(options?.plural ?? name, !!options?.plural);

		graphweaverMetadata.collectEntityInformation({
			...options,
			name,
			plural,
			target,
		});

		return target;
	};
}
