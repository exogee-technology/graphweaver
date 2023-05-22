import { Float, Field } from 'type-graphql';
import { ReadOnly } from '@exogee/graphweaver';

export const caps = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const setNameOnClass = (target: any, name: string) =>
	Object.defineProperty(target, 'name', { value: name });

export const createFieldOnClass = (
	target: any,
	name: string,
	type: 'string' | 'float' | 'boolean',
	value: (dataEntity: any) => any,
	fieldOptions?: any
) => {
	Object.defineProperty(target.prototype, name, {
		value() {
			return value(this.dataEntity);
		},
	});
	Field(typeFunctionForType(type), fieldOptions)(
		target.prototype,
		name,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error @todo fix the types with TypedPropertyDescriptor
		Object.getOwnPropertyDescriptor(target.prototype, name)
	);
};

export const setClassReadOnly = (target: any) => {
	// eslint-disable-next-line prefer-spread
	ReadOnly.apply(null, target.prototype);
};

export const typeFunctionForType = (type: 'string' | 'float' | 'boolean'): any => {
	switch (type) {
		case 'string':
			return () => String;
		case 'float':
			return () => Float;
		case 'boolean':
			return () => Boolean;
	}
};
