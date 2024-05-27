import { InputTypeMetadata, graphweaverMetadata } from '..';

export type InputTypeOptions = Omit<InputTypeMetadata<any, any>, 'type' | 'fields' | 'target'>;

export function InputType(name: string): ClassDecorator;
export function InputType(options: InputTypeOptions): ClassDecorator;
export function InputType(nameOrOptions?: string | InputTypeOptions) {
	return (target: any) => {
		const options = typeof nameOrOptions === 'string' ? { name: nameOrOptions } : nameOrOptions;
		const name = options?.name ?? (target as any).name;

		if (!name) {
			throw new Error('Could not determine name for input type.');
		}

		graphweaverMetadata.collectInputTypeInformation({
			...options,

			name,
			target,
		});

		return target;
	};
}
