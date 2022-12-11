import 'reflect-metadata';

const summaryFieldKey = Symbol('GraphWeaverSummaryFieldKey');

export function SummaryField() {
	return (target: any, propertyKey: string | symbol) => {
		// Normally we'd just return Reflect.metadata(), but TypeGraphQL works on the constructor
		// as the target, so we need to as well for later.
		Reflect.metadata(summaryFieldKey, true)(target.constructor, propertyKey);
	};
}

export function isSummaryField(target: any, propertyKey: string) {
	return !!Reflect.getMetadata(summaryFieldKey, target, propertyKey);
}
