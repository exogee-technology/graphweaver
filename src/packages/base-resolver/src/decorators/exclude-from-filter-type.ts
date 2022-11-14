import 'reflect-metadata';

const filterTypeExcludedKey = Symbol('BaseResolverFilterTypeExcluded');

export function ExcludeFromFilterType() {
	return (target: any, propertyKey: string | symbol) => {
		// Normally we'd just return Reflect.metadata(), but TypeGraphQL works on the constructor
		// as the target, so we need to as well for later.
		Reflect.metadata(filterTypeExcludedKey, true)(target.constructor, propertyKey);
	};
}

export function isExcludedFromFilterType(target: any, propertyKey: string) {
	return !!Reflect.getMetadata(filterTypeExcludedKey, target, propertyKey);
}
