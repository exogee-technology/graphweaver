import 'reflect-metadata';

const readOnlyKey = Symbol('BaseResolverReadOnly');

export function ReadOnly() {
	return Reflect.metadata(readOnlyKey, true);
}

export function isReadOnly(target: any) {
	return !!Reflect.getMetadata(readOnlyKey, target);
}