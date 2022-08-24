import 'reflect-metadata';

const readOnlyPropertyKey = Symbol('BaseResolverReadOnlyProperty');

export function ReadOnlyProperty() {
	return (target: any, propertyKey: string | symbol) => {
		// Normally we'd just return Reflect.metadata(), but TypeGraphQL works on the constructor
		// as the target, so we need to as well for later.
		Reflect.metadata(readOnlyPropertyKey, true)(target.constructor, propertyKey);
	};
}

export function isReadOnlyProperty(target: any, propertyKey: string) {
	return !!Reflect.getMetadata(readOnlyPropertyKey, target, propertyKey);
}