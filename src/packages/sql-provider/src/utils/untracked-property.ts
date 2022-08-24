import 'reflect-metadata';

const untrackedPropertyMetadataKey = Symbol('UntrackedProperty');

export function UntrackedProperty() {
	return Reflect.metadata(untrackedPropertyMetadataKey, true);
}

export function isUntrackedProperty(target: any, propertyKey: string) {
	return Reflect.getMetadata(untrackedPropertyMetadataKey, target, propertyKey);
}
