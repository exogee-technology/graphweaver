import 'reflect-metadata';

const inputTypeExcludedKey = Symbol('BaseResolverInputTypeExcluded');

export function ExcludeFromInputTypes() {
	return (target: any, propertyKey: string | symbol) => {
		// Normally we'd just return Reflect.metadata(), but TypeGraphQL works on the constructor
		// as the target, so we need to as well for later.
		Reflect.metadata(inputTypeExcludedKey, true)(target.constructor, propertyKey);
	};
}

export function isExcludedFromInputTypes(target: any, propertyKey: string) {
	return !!Reflect.getMetadata(inputTypeExcludedKey, target, propertyKey);
}
